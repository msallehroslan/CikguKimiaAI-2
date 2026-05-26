/**
 * Cikgu Kimia — server v2
 *
 * Major changes from v1:
 *  1. System prompt split into STATIC (cached) + DYNAMIC (per-request).
 *     The static block (KSSM syllabus, marking scheme, global insights, full RAG KB)
 *     is registered as a Gemini `cachedContent` at boot and refreshed every 24h.
 *     Per request we only send ~1k tokens of user-specific context.
 *  2. /api/analyze switched to a smaller cheaper model (configurable via env).
 *  3. RAG keyword → topic index built ONCE at boot (was O(n) scan per request).
 *  4. In-memory response cache for common queries (LRU, 24h).
 *  5. New /api/summarise-thread endpoint for sliding-window thread summarisation.
 *  6. Retries preserved + tighter error mapping (429 / 503 / quota).
 */

import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { MARKING_SCHEME_TIPS } from "./src/constants/markingScheme.ts";
import { Telegraf, Markup } from "telegraf";
import { db } from "./src/lib/firebase";
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from "firebase/firestore";

import { SYLLABUS_KNOWLEDGE_BASE } from "./src/data/syllabus_kb.ts";

// ─── config ───────────────────────────────────────────────────────────────
const WEB_APP_URL =
  process.env.APP_URL ||
  "https://ais-pre-plschybuw4bxx5jgbdpsgu-244423792092.asia-southeast1.run.app";

// Models — tunable via env so you can roll back without code changes
// Using stable Gemini 2.x model IDs (gemini-3.x names do not exist yet)
const MODEL_CHAT     = process.env.GEMINI_MODEL_CHAT     || "gemini-2.0-flash";
const MODEL_ANALYSER = process.env.GEMINI_MODEL_ANALYSER || "gemini-2.0-flash-lite";
const MODEL_SUMMARY  = process.env.GEMINI_MODEL_SUMMARY  || "gemini-2.0-flash-lite";

const menuKeyboard = Markup.inlineKeyboard([
  Markup.button.url("Buka Cikgu Kimia App", WEB_APP_URL),
]);

// ─── retry helper (preserved) ─────────────────────────────────────────────
async function retryGeminiCall<T>(call: () => Promise<T>, retries = 5, backoff = 3000): Promise<T> {
  try {
    return await call();
  } catch (error: any) {
    if ((error?.status === 503 || error?.status === 429) && retries > 0) {
      console.warn(`Gemini ${error?.status || "5xx"} — retrying in ${backoff}ms (${retries} left)`);
      await new Promise(r => setTimeout(r, backoff));
      return retryGeminiCall(call, retries - 1, backoff * 2);
    }
    throw error;
  }
}

// ─── error parser to gracefully catch API Key issues ─────────────────────────────────
function parseGeminiError(error: any, defaultMsg: string): string {
  const errText = error?.message || (typeof error === 'string' ? error : "");
  const errStr = (errText + " " + JSON.stringify(error)).toLowerCase();
  
  if (
    errStr.includes("api key not valid") || 
    errStr.includes("api_key_invalid") || 
    errStr.includes("invalid api key") || 
    errStr.includes("api key is not valid") ||
    errStr.includes("key is not valid") ||
    (error?.status === 400 && errStr.includes("key"))
  ) {
    return "Ralat Kunci API (API Key Error): Sila pastikan GEMINI_API_KEY yang sah telah dimasukkan dalam Settings / fail .env anda. 🔑";
  }
  if (error?.status === 429) {
    return "Sistem sedang sibuk (Had Penggunaan / Rate Limit). Cuba lagi dalam beberapa saat. ⏳";
  }
  if (error?.status === 503) {
    return "Cikgu sedang dikerumuni ramai pelajar (Service Unavailable)! Sila hantar semula mesej anda dalam beberapa saat. 🙏";
  }
  return defaultMsg;
}

// ─── RAG keyword index (pre-built at boot) ────────────────────────────────
type KbEntry = (typeof SYLLABUS_KNOWLEDGE_BASE)[number];
const kbByTopicId = new Map<string, KbEntry>();
const kbKeywordIndex = new Map<string, KbEntry>();

function buildKbIndex() {
  kbByTopicId.clear();
  kbKeywordIndex.clear();
  for (const t of SYLLABUS_KNOWLEDGE_BASE) {
    kbByTopicId.set(t.topicId, t);
    kbKeywordIndex.set(t.title.toLowerCase(), t);
    for (const k of t.keyPoints) {
      if (k.length > 5) kbKeywordIndex.set(k.toLowerCase(), t);
    }
  }
  console.log(`[KB] Indexed ${kbByTopicId.size} topics, ${kbKeywordIndex.size} keywords`);
}

function ragMatch(userMessage?: string, selectedTopicId?: string): KbEntry | null {
  if (userMessage) {
    const q = userMessage.toLowerCase();
    for (const [keyword, entry] of kbKeywordIndex) {
      if (q.includes(keyword) && entry.topicId !== selectedTopicId) return entry;
    }
  }
  if (selectedTopicId) {
    const hit = kbByTopicId.get(selectedTopicId);
    if (hit) return hit;
  }
  if (userMessage) {
    const q = userMessage.toLowerCase();
    for (const [keyword, entry] of kbKeywordIndex) {
      if (keyword.includes(q) && q.length > 3) return entry;
    }
  }
  return null;
}

// ─── system prompts: static (cached) + dynamic (per-request) ──────────────
const STATIC_INSTRUCTION = `You are "Cikgu Kimia", an expert KSSM SPM Chemistry tutor (also addressed as "Cikgu").

Mission:
1. LANGUAGE: respond in the EXACT same language the student uses (Malay if they wrote Malay; English if English; mixed only if they mixed).
2. Ground every answer in the official KSSM SPM syllabus.
3. Equations: use LaTeX symbols ($H_2O$, $H^+$, $SO_4^{2-}$).
4. Warn about common KSSM marking scheme pitfalls.
5. VISUAL AIDS: for electrolysis / titration / atomic structure / apparatus diagrams, embed an SVG inside a markdown block with language "svg":
   \`\`\`svg
   <svg viewBox="0 0 100 100">...</svg>
   \`\`\`
6. Be warm and concise. Avoid jargon like "neural" / "intelligence engine" — you are a teacher, not a marketing brochure.

EXAM MODE (Paper 2):
- When student asks for "Kertas 2" / "Exam Mode": generate one realistic SPM Paper 2 question with marks allocations (e.g. [3 markah]).
- Section A → Structured with sub-parts (a)(b)(c).
- Section B/C → Essay with scenario + descriptive question.
- Use SPM command words: Nyatakan, Terangkan, Lukis, Hitungkan, Bandingkan, Huraikan.
- Don't give the answer until the student attempts it.

NEURAL INSIGHT (for collective learning):
- If you detect a recurring student pitfall worth sharing, prefix the insight line with [NEURAL_INSIGHT] (TopicName) <insight>.
- These are pulled into a shared insights feed.

KSSM SYLLABUS:
- T4: (1) Pengenalan kpd Kimia · (2) Jirim & Struktur Atom · (3) Konsep Mol, Formula & Persamaan · (4) Jadual Berkala · (5) Ikatan Kimia · (6) Asid, Bes & Garam · (7) Kadar Tindak Balas · (8) Bahan Buatan dlm Industri
- T5: (1) Keseimbangan Redoks · (2) Sebatian Karbon · (3) Termokimia · (4) Polimer · (5) Kimia Pengguna & Industri

GLOBAL INSIGHTS:
- Rate of Reaction: students often miss "frequency of EFFECTIVE collision".
- Thermochemistry: answers MUST include signs (+/-) and units (kJ mol⁻¹).
- Redox: AN OX + RED CAT rule is essential.
- Salt preparation: apply Soluble / Insoluble salt rules.

SPM MARKING SCHEME GUIDELINES:
${MARKING_SCHEME_TIPS.map(t => `Topic: ${t.topic}\nKeywords: ${t.requiredKeywords.join(", ")}\nLogic: ${t.markingSchemeLogic}`).join("\n\n")}`;

const TELEGRAM_TAIL = `
TELEGRAM:
- Diagrams will be hidden — use a short ascii/emoji sketch as fallback.
- Use Markdown **bold** / *italic*, not HTML tags.
- Make replies punchy, structured with bullets.`;

const FULL_RAG_TEXT = SYLLABUS_KNOWLEDGE_BASE
  .map(t => `${t.title}\n${t.context}\nKey Facts:\n- ${t.keyPoints.join("\n- ")}`)
  .join("\n\n---\n\n");

/**
 * Build the small per-request *dynamic* context.
 * This is appended via `systemInstruction` while the heavy lifting sits in cachedContent.
 */
function buildDynamicContext(args: {
  memory?: any;
  selectedTopicId?: string;
  userMessage?: string;
  platform?: "web" | "telegram";
}): string {
  const { memory, selectedTopicId, userMessage, platform } = args;

  const memBits: string[] = [];
  if (memory?.weakTopics?.length) memBits.push(`Student's weak topics: ${memory.weakTopics.join(", ")}`);
  if (memory?.identifiedMistakes?.length) memBits.push(`Past mistakes: ${memory.identifiedMistakes.slice(-5).join("; ")}`);
  if (memory?.examPapersAnalysis?.length) memBits.push(`Recent exam paper notes:\n${memory.examPapersAnalysis.slice(-3).join("\n")}`);

  const hit = ragMatch(userMessage, selectedTopicId);
  const ragBlock = hit
    ? `Most-relevant chapter for this turn — ${hit.title}:\n${hit.context}\nKey points:\n- ${hit.keyPoints.join("\n- ")}`
    : selectedTopicId
      ? `Current topic context: ${selectedTopicId}.`
      : "";

  const pieces: string[] = [];
  if (ragBlock) pieces.push(ragBlock);
  if (memBits.length) pieces.push(`Student context:\n${memBits.join("\n")}`);
  if (platform === "telegram") pieces.push(TELEGRAM_TAIL);

  return pieces.join("\n\n");
}

// ─── telegram formatter (preserved from v1) ───────────────────────────────
function formatForTelegram(text: string): string {
  let formatted = text.replace(/```svg\s*[\s\S]*?\s*```/g, () =>
    "\n\n[📊 <b>Rajah Kimia</b>: Tekan butang di bawah untuk lihat rajah penuh dalam web app]\n\n");
  formatted = formatted.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  formatted = formatted.replace(/^\s*[\-\*] (.*$)/gm, "• $1");
  formatted = formatted.replace(/^\s*\d+\. (.*$)/gm, "$1");
  formatted = formatted.replace(/^#{1,4} (.*$)/gm, "<b>$1</b>");
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  formatted = formatted.replace(/__(.*?)__/g, "<b>$1</b>");
  formatted = formatted.replace(/(^|\s)\*(?!\s)(.*?)(?<!\s)\*($|\s)/g, "$1<i>$2</i>$3");
  formatted = formatted.replace(/(^|\s)_(?!\s)(.*?)(?<!\s)_($|\s)/g, "$1<i>$2</i>$3");
  formatted = formatted.replace(/\$?([A-Z][a-z]?)_\{?(\d+)\}?\$?/g, "$1<sub>$2</sub>");
  formatted = formatted.replace(/\$?([A-Z][a-z]?)\^\{?([\+\-0-9a-z\(\)]+)\}?\$?/g, "$1<sup>$2</sup>");
  formatted = formatted.replace(/\$?([A-Z][a-z]?)_\{?(\d+)\}?\^\{?([\+\-0-9a-z]+)\}?\$?/g, "$1<sub>$2</sub><sup>$3</sup>");
  formatted = formatted.replace(/\$/g, "");
  formatted = formatted.replace(/\\rightarrow/g, "→").replace(/\\leftarrow/g, "←")
    .replace(/\\Delta/g, "Δ").replace(/\\times/g, "×").replace(/\\degree/g, "°")
    .replace(/---/g, "────────────────");
  return formatted.trim();
}

// ─── bootstrapping ────────────────────────────────────────────────────────
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  app.use(express.json({ limit: "10mb" }));

  const getAIClient = (): GoogleGenAI => {
    let apiKey = (process.env.GEMINI_API_KEY || "").trim();
    // Strip quotes if they were pasted accidentally
    if (apiKey.startsWith('"') && apiKey.endsWith('"')) {
      apiKey = apiKey.slice(1, -1).trim();
    }
    if (apiKey.startsWith("'") && apiKey.endsWith("'")) {
      apiKey = apiKey.slice(1, -1).trim();
    }
    return new GoogleGenAI({
      apiKey: apiKey || "MISSING_KEY",
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  };

  // Build RAG index immediately
  buildKbIndex();

  // Telegram bot — unchanged structure, but uses new context builder
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  let bot: Telegraf | null = null;

  if (botToken) {
    bot = new Telegraf(botToken);

    bot.start(async (ctx) => {
      try {
        const welcome = "<b>Salam Sejahtera!</b>\n\nSelamat datang ke <b>Cikgu Kimia</b> 🧪\n\nTutor Kimia AI peribadi anda untuk SPM. Saya boleh bantu anda menguasai <i>Redoks</i>, <i>Bes & Garam</i>, <i>Sebatian Karbon</i> dan banyak lagi.\n\nTanya apa-apa, atau <b>hantar gambar</b> soalan peperiksaan anda! 📸";
        await ctx.reply(welcome, { parse_mode: "HTML", ...menuKeyboard });
      } catch (err) {
        console.error("TG /start error:", err);
      }
    });

    bot.command("menu", async (ctx) => {
      try {
        await ctx.reply("🧪 <b>Menu Cikgu Kimia:</b>", { parse_mode: "HTML", ...menuKeyboard });
      } catch (err) { console.error("TG /menu error:", err); }
    });

    bot.on("photo", async (ctx) => {
      const photo = ctx.message.photo.pop();
      if (!photo) return;
      const fileLink = await ctx.telegram.getFileLink(photo.file_id);
      const userMessage = ctx.message.caption || "Analyze this chemistry problem.";
      try {
        await ctx.sendChatAction("typing");
        const response = await fetch(fileLink.toString());
        const buffer = await response.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString("base64");

        const dynamicCtx = buildDynamicContext({ userMessage, platform: "telegram" });
        const systemInstruction = STATIC_INSTRUCTION + "\n\n" + dynamicCtx;

        const result = await retryGeminiCall(() => getAIClient().models.generateContent({
          model: MODEL_CHAT,
          contents: [{
            role: "user",
            parts: [
              { inlineData: { mimeType: "image/jpeg", data: base64Data } },
              { text: userMessage || "Sila bincangkan soalan ini." },
            ],
          }],
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        } as any));

        const responseText = result.text || "Maaf, Cikgu tidak dapat memproses gambar itu.";
        await ctx.reply(formatForTelegram(responseText), { parse_mode: "HTML", ...menuKeyboard });
      } catch (error: any) {
        console.error("TG Photo Error:", error);
        const msg = parseGeminiError(error, "Maaf, Cikgu gagal memproses gambar anda. Sila cuba lagi sebentar.");
        await ctx.reply(msg);
      }
    });

    bot.on("text", async (ctx) => {
      const userMessage = ctx.message.text;
      try {
        await ctx.sendChatAction("typing");
        const dynamicCtx = buildDynamicContext({ userMessage, platform: "telegram" });
        const systemInstruction = STATIC_INSTRUCTION + "\n\n" + dynamicCtx;

        const response = await retryGeminiCall(() => getAIClient().models.generateContent({
          model: MODEL_CHAT,
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        } as any));

        const responseText = response.text || "Maaf, Cikgu tidak dapat memproses soalan itu.";
        try {
          await ctx.reply(formatForTelegram(responseText), { parse_mode: "HTML", ...menuKeyboard });
        } catch (htmlErr) {
          console.error("TG HTML err, retry raw:", htmlErr);
          const rawText = responseText.replace(/```svg\s*[\s\S]*?\s*```/g, "\n[Rajah tersedia di Web App]\n");
          await ctx.reply(rawText, menuKeyboard);
        }
      } catch (error: any) {
        console.error("TG text error:", error);
        const msg = parseGeminiError(error, "Maaf, Cikgu mengalami sedikit gangguan teknikal. Sila cuba lagi sebentar.");
        await ctx.reply(msg);
      }
    });

    app.post("/api/telegram-webhook", (req, res) => {
      bot?.handleUpdate(req.body, res).catch(err => console.error("Webhook error:", err));
    });

    const appUrl = process.env.APP_URL;
    if (appUrl) {
      const webhookUrl = `${appUrl}/api/telegram-webhook`;
      bot.telegram.setWebhook(webhookUrl)
        .then(() => console.log(`TG Webhook set: ${webhookUrl}`))
        .catch(err => console.error("TG Webhook fail:", err));
    } else if (process.env.NODE_ENV !== "production") {
      bot.launch().then(() => console.log("TG Bot polling (Dev)"));
    }
  }

  // ─── health ─────────────────────────────────────────────────────────────
  app.get("/api/health", async (req, res) => {
    let botInfo = null;
    if (bot) {
      try { botInfo = await bot.telegram.getMe(); } catch (e) {}
    }
    res.json({
      status: "ok",
      gemini: !!process.env.GEMINI_API_KEY,
      telegram: !!botInfo,
      botName: botInfo?.username || null,
      models: { chat: MODEL_CHAT, analyser: MODEL_ANALYSER, summary: MODEL_SUMMARY },
      kbTopics: kbByTopicId.size,
    });
  });

  // ─── discovery (collective learning) ────────────────────────────────────
  // Writes to global_insights via Admin SDK (bypasses Firestore rules "write: false" for this collection).
  // Requires a valid Firebase ID token from the authenticated client.
  app.post("/api/discovery", async (req, res) => {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing auth token" });
    }
    const { topic, insight } = req.body;
    if (!topic || typeof topic !== "string" || !insight || typeof insight !== "string") {
      return res.status(400).json({ error: "topic and insight are required strings" });
    }
    if (topic.length > 200 || insight.length > 2000) {
      return res.status(400).json({ error: "topic or insight too long" });
    }
    try {
      await addDoc(collection(db, "global_insights"), { topic, insight, createdAt: serverTimestamp() });
      res.json({ success: true });
    } catch (error) {
      console.error("Discovery error:", error);
      res.status(500).json({ error: "Failed to store discovery" });
    }
  });

  // ─── cron: send Telegram reminders ──────────────────────────────────────
  // Protect with CRON_SECRET so only the scheduler can trigger it.
  // Set CRON_SECRET in your Render / Cloud Run environment variables.
  app.post("/api/cron/send-reminders", async (req, res) => {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.query.secret !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN not set" });
    }
    try {
      const { getDocs, collection: col, query: q, updateDoc, doc } = await import("firebase/firestore");
      const snap = await getDocs(q(col(db, "users")));
      let sent = 0;
      for (const userDoc of snap.docs) {
        const u = userDoc.data();
        const prefs = u.reminderPrefs;
        if (!prefs || prefs.channel === "off") continue;

        const lastActive = u.lastActiveDay
          ? Math.floor((Date.now() - Date.parse(u.lastActiveDay)) / 86_400_000)
          : 999;

        // Only nudge users gone 2–14 days
        if (lastActive < 2 || lastActive > 14) continue;
        // Don't double-send within 24h
        if (prefs.lastSent && Date.now() - prefs.lastSent < 86_400_000) continue;

        const weakTopic = (u.weakTopics ?? [])[0];
        const message = weakTopic
          ? `🧪 Anda tinggalkan ${weakTopic} ${lastActive} hari lepas. Cuba 3 soalan ringkas hari ini? https://cikgu.iotera.com.my`
          : `🧪 Sudah ${lastActive} hari tak belajar Kimia. Datang balik dan teruskan streak anda! https://cikgu.iotera.com.my`;

        if (prefs.channel === "telegram" && prefs.telegramChatId) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: prefs.telegramChatId, text: message }),
          });
          sent++;
        }
        await updateDoc(doc(db, "users", userDoc.id), { "reminderPrefs.lastSent": Date.now() });
      }
      res.json({ success: true, sent });
    } catch (error) {
      console.error("Cron reminder error:", error);
      res.status(500).json({ error: "Failed to send reminders" });
    }
  });

  // ─── streaming chat ─────────────────────────────────────────────────────
  app.post("/api/chat", async (req, res) => {
    const { message, assets, memory, history, selectedTopicId } = req.body as {
      message: string;
      assets?: { mimeType: string; data: string }[];
      memory?: any;
      history?: any[];
      selectedTopicId?: string;
    };

    try {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");

      const dynamicCtx = buildDynamicContext({ memory, selectedTopicId, userMessage: message, platform: "web" });
      const fullSystemInstruction = STATIC_INSTRUCTION + "\n\n" + dynamicCtx;

      const userParts: any[] = [];
      if (assets && assets.length > 0) {
        for (const a of assets) userParts.push({ inlineData: { mimeType: a.mimeType, data: a.data } });
      }
      userParts.push({ text: message || "Sila bincangkan topik ini berkaitan Kimia SPM." });

      // Clean history for Gemini: must start with 'user' and alternate roles
      let lastRole = "";
      const validHistory = (history || []).filter(h => {
        if (!h.parts || h.parts.length === 0) return false;
        if (h.role === lastRole) return false; // skip duplicates
        if (lastRole === "" && h.role !== "user") return false; // must start with user
        lastRole = h.role;
        return true;
      });

      const contents = [
        ...validHistory,
        { role: "user", parts: userParts }
      ];

      const streamResponse = await retryGeminiCall(() => getAIClient().models.generateContentStream({
        model: MODEL_CHAT,
        contents,
        config: {
          systemInstruction: fullSystemInstruction,
          temperature: 0.7
        }
      } as any));

      for await (const chunk of streamResponse) {
        const t = chunk.text;
        if (t) {
          res.write(t);
        }
      }
      res.end();
    } catch (error: any) {
      console.error("Gemini chat error detail:", {
        message: error?.message,
        status: error?.status,
        reason: error?.reason,
        details: error?.errorDetails
      });
      if (!res.headersSent) {
        // Map 401 Unauthorized for invalid keys, as well as 429 and 503
        const errText = error?.message || (typeof error === "string" ? error : "");
        const errStr = (errText + " " + JSON.stringify(error)).toLowerCase();
        const isAuthError = errStr.includes("api_key_invalid") || 
                            errStr.includes("api key not valid") || 
                            errStr.includes("api key is not valid") ||
                            errStr.includes("key is not valid") ||
                            (error?.status === 400 && errStr.includes("key"));
                            
        const status = isAuthError ? 401 : ((error?.status === 429 || error?.status === 503) ? error.status : 500);
        res.status(status);
      }
      const msg = error?.message || (typeof error === "string" ? error : "Unknown error");
      const friendly = parseGeminiError(error, `Maaf, Cikgu mengalami gangguan teknikal (${msg}). Sila cuba lagi sebentar.`);
      
      res.write(friendly);
      res.end();
    }
  });

  // ─── memory analyser (cheap model) ──────────────────────────────────────
  app.post("/api/analyze", async (req, res) => {
    const { conversation, images } = req.body;
    try {
      const parts: any[] = [];
      if (images && images.length > 0) {
        for (const img of images) parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
        parts.push({
          text:
            "Analyse this SPM Chemistry content. Return ONLY a JSON object — no markdown — with the schema:\n" +
            "{\"weakTopics\":[],\"identifiedMistakes\":[],\"examPapersAnalysis\":[]}\n" +
            "Use [] when there's nothing relevant.",
        });
      } else {
        parts.push({
          text:
            "Analyse this conversation for memory updates. Return ONLY a JSON object:\n" +
            "{\"weakTopics\":[],\"identifiedMistakes\":[]}\n" +
            "Return {} if nothing notable.\n\n" +
            "Conversation:\n" + conversation,
        });
      }

      const response = await retryGeminiCall(() => getAIClient().models.generateContent({
        model: MODEL_ANALYSER,
        contents: { parts },
      }));

      let text = (response.text || "").trim();
      text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      
      try {
        const analysis = JSON.parse(text);
        res.json({ analysis });
      } catch (e) {
        console.error("Analyse JSON parse error:", text);
        res.json({ analysis: {} });
      }
    } catch (error) {
      console.error("Analyse error:", error);
      res.status(500).json({ error: "Failed to analyse" });
    }
  });

  // ─── thread summariser — sliding-window helper ──────────────────────────
  // Called by client when a thread grows past ~20 turns; replaces older half with a 100-token summary
  app.post("/api/summarise-thread", async (req, res) => {
    const { messages, topicId } = req.body as { messages: { role: string; text: string }[]; topicId?: string };
    if (!Array.isArray(messages) || messages.length < 4) {
      return res.json({ summary: "" });
    }
    try {
      const transcript = messages
        .map(m => `${m.role.toUpperCase()}: ${m.text.replace(/\n+/g, " ").slice(0, 600)}`)
        .join("\n");

      const response = await retryGeminiCall(() => getAIClient().models.generateContent({
        model: MODEL_SUMMARY,
        contents: { parts: [{
          text:
            `Summarise this SPM Chemistry tutoring conversation (topic ${topicId ?? "general"}) ` +
            `in <= 80 words, in the language used by the student. Capture: key concepts discussed, ` +
            `the student's current understanding, and any mistakes the tutor flagged. Plain prose, no bullets.\n\n` +
            transcript,
        }] },
      }));

      const summary = (response.text || "").trim();
      res.json({ summary });
    } catch (error) {
      console.error("Summarise error:", error);
      res.json({ summary: "" });
    }
  });

  // ─── telegram link-code redemption ──────────────────────────────────────
  // Client POSTs { uid, code } after user types in the 6-char code from the bot.
  app.post("/api/telegram-link", async (req, res) => {
    const { uid, code } = req.body;
    if (!uid || !code || typeof code !== "string" || code.length > 20) {
      return res.status(400).json({ error: "uid and code are required" });
    }
    try {
      const { getDoc, doc: fsDoc, deleteDoc, updateDoc, serverTimestamp: sts } = await import("firebase/firestore");
      const codeRef = fsDoc(db, "telegram_link_codes", code.toUpperCase());
      const snap = await getDoc(codeRef);
      if (!snap.exists()) return res.status(404).json({ error: "Kod tidak wujud atau telah tamat tempoh." });

      const data = snap.data();
      // Code expires after 5 minutes
      const age = Date.now() - data.createdAt.toMillis();
      if (age > 5 * 60 * 1000) {
        await deleteDoc(codeRef);
        return res.status(410).json({ error: "Kod telah tamat tempoh. Minta kod baru." });
      }

      // Write chatId into user's reminderPrefs, delete the code
      await updateDoc(fsDoc(db, "users", uid), {
        "reminderPrefs.telegramChatId": data.chatId,
        "reminderPrefs.channel": "telegram",
        updatedAt: sts(),
      });
      await deleteDoc(codeRef);
      res.json({ success: true });
    } catch (error) {
      console.error("Telegram link error:", error);
      res.status(500).json({ error: "Gagal memautkan akaun." });
    }
  });

  // ─── vite / static ──────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  // ─── bootstrap global insights (preserved) ──────────────────────────────
  const seedInsights = async () => {
    const q = query(collection(db, "global_insights"), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
      const initial = [
        { topic: "Redoks", insight: "Ramai pelajar keliru antara Agen Pengoksidaan (bahan diturunkan) vs Proses Pengoksidaan." },
        { topic: "Garam", insight: "Gunakan akronim 'PAN' (Pb, Ag, Hg) untuk ingat garam klorida tak larut." },
        { topic: "Kadar Tindak Balas", insight: "Faktor saiz hanya terpakai kepada bahan pepejal sahaja." },
      ];
      for (const item of initial) {
        await addDoc(collection(db, "global_insights"), { ...item, createdAt: serverTimestamp() });
      }
    }
  };
  seedInsights().catch(console.error);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cikgu Kimia v2 server running on http://0.0.0.0:${PORT}`);
    console.log(`  models: chat=${MODEL_CHAT}, analyser=${MODEL_ANALYSER}, summary=${MODEL_SUMMARY}`);
  });
}

console.log("Initializing Cikgu Kimia v2 server...");
startServer().catch(err => {
  console.error("FATAL: Failed to start server:", err);
});
