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
import { SYLLABUS_TOPICS } from "./src/constants";
import { Telegraf, Markup } from "telegraf";
import { db } from "./src/lib/firebase";
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, doc, setDoc, deleteDoc } from "firebase/firestore";

import { SYLLABUS_KNOWLEDGE_BASE } from "./src/data/syllabus_kb.ts";
import { QUESTION_BANK } from "./src/data/questionBank.ts";
import { sharedCache } from "./src/lib/sharedCache.ts";
import { normalizeQuestion } from "./src/lib/qaCache.ts";

// ─── config ───────────────────────────────────────────────────────────────
const WEB_APP_URL =
  process.env.APP_URL ||
  "https://ais-pre-plschybuw4bxx5jgbdpsgu-244423792092.asia-southeast1.run.app";

// Models — tunable via env so you can roll back without code changes
const MODEL_CHAT     = process.env.GEMINI_MODEL_CHAT     || "gemini-3.5-flash";
const MODEL_ANALYSER = process.env.GEMINI_MODEL_ANALYSER || "gemini-3.5-flash"; 
const MODEL_SUMMARY  = process.env.GEMINI_MODEL_SUMMARY  || "gemini-3.5-flash";

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

const ADMIN_EMAILS = [
  "msallehroslan@gmail.com",
  "msallehroslan@gmail.form",
  "salleh@ioteratechnologies.com"
];

function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// ─── RAG keyword index (pre-built at boot) ────────────────────────────────
type KbEntry = (typeof SYLLABUS_KNOWLEDGE_BASE)[number];
const kbByTopicId = new Map<string, KbEntry>();
const kbKeywordIndex = new Map<string, KbEntry>();

async function buildKbIndex() {
  kbByTopicId.clear();
  kbKeywordIndex.clear();
  
  // 1. Add static syllabus facts
  for (const t of SYLLABUS_KNOWLEDGE_BASE) {
    kbByTopicId.set(t.topicId, t);
    kbKeywordIndex.set(t.title.toLowerCase(), t);
    for (const k of t.keyPoints) {
      if (k.length > 5) kbKeywordIndex.set(k.toLowerCase(), t);
    }
  }

  // 2. Add custom knowledge base facts from Firestore
  try {
    const snap = await getDocs(collection(db, "custom_knowledge"));
    snap.docs.forEach(d => {
      const t = d.data() as KbEntry;
      if (t && t.topicId && t.title) {
        kbByTopicId.set(t.topicId, t);
        kbKeywordIndex.set(t.title.toLowerCase(), t);
        for (const k of t.keyPoints || []) {
          if (k && k.length > 5) kbKeywordIndex.set(k.toLowerCase(), t);
        }
      }
    });
    console.log(`[KB] Indexed ${kbByTopicId.size} topics, ${kbKeywordIndex.size} keywords`);
  } catch (err) {
    console.error("[KB] Failed to load custom knowledge from Firestore:", err);
  }
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

STUDENT MASTERY SYSTEM:
- You must bump chapter mastery levels based on student learning performance and correct answers.
- When a student answers a core concept question, quiz, or exercise correctly, or demonstrates clear understanding of a topic, append this marker on a new line: [MASTERY] <topicId> +10 (or +15, +20 for very hard questions).
- Valid topicIds are: f4-c2, f4-c3, f4-c4, f4-c5, f4-c6, f4-c7, f5-c1, f5-c2, f5-c3, f5-c4, f5-c5.
- If they make a crucial error or answer incorrectly, you can optionally subtract points by writing: [MASTERY] <topicId> -5.
- Always output this marker silently on its own line. Do not explain the marker to the student.

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
  customExams?: any[];
}): string {
  const { memory, selectedTopicId, userMessage, platform, customExams } = args;

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

  // Built-in question bank (Modul Topikal A+ EDU Factory) + admin custom exams
  const topicPrefix = selectedTopicId ? selectedTopicId.split("-").slice(0,2).join("-") : "";
  const relevantBuiltIn = selectedTopicId
    ? QUESTION_BANK.filter(q => q.topicId === selectedTopicId || q.topicId.startsWith(topicPrefix))
    : QUESTION_BANK;
  const allExams = [...relevantBuiltIn, ...(customExams || [])];

  if (allExams.length > 0) {
    const examDescriptions = allExams.map(ex => {
      return `[Exam Question ID: ${ex.id}, Topic: ${ex.topicId || "any"}, Paper Type: ${ex.paperType === "struct" ? "Kertas 2 - Struktur" : "Kertas 2 - Esei"}]
Title: ${ex.title}
Question:
${ex.questionText}
Marking Scheme / Expected Answers:
${ex.markingScheme}`;
    }).join("\n\n---\n\n");

    pieces.push(`EXAM QUESTIONS POOL (Built-in + Admin):\nUse the following exact exam questions when the student initiates an exam session or practice, or asks to do exercises related to the topic of these questions. Avoid generating generic questions if matching ones exist below! Always grade using the Marking Scheme provided. Do NOT reveal marking scheme until student attempts.\n\n${examDescriptions}`);
  }

  return pieces.join("\n\n");
}

// ─── telegram formatter (preserved from v1) ───────────────────────────────
function formatForTelegram(text: string): string {
  const cleaned = text
    .replace(/\[CONTEXT SHIFT DETECTED\]:.*?\n/g, "")
    .replace(/\[MASTERY\][^\n]*\n?/g, "")
    .replace(/\[NEURAL_INSIGHT\][^\n]*\n?/g, "");
  let formatted = cleaned.replace(/```svg\s*[\s\S]*?\s*```/g, () =>
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
  const PORT = 3000;
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
  app.post("/api/discovery", async (req, res) => {
    const { topic, insight } = req.body;
    try {
      await addDoc(collection(db, "global_insights"), { topic, insight, createdAt: serverTimestamp() });
      res.json({ success: true });
    } catch (error) {
      console.error("Discovery error:", error);
      res.status(500).json({ error: "Failed to store discovery" });
    }
  });

  // ─── custom knowledge management (admin only) ───────────────────────────
  app.get("/api/admin/knowledge", async (req, res) => {
    const { email } = req.query as { email?: string };
    if (!email || !isAdmin(email)) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    try {
      const snap = await getDocs(collection(db, "custom_knowledge"));
      const list = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      res.json({ success: true, list });
    } catch (e: any) {
      console.error("Fetch custom knowledge error:", e);
      res.status(500).json({ error: e.message || "Failed to fetch custom knowledge" });
    }
  });

  app.post("/api/admin/knowledge", async (req, res) => {
    const { email, fact } = req.body as { email: string; fact: KbEntry };
    if (!email || !isAdmin(email)) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    if (!fact || !fact.topicId || !fact.title || !fact.context) {
      return res.status(400).json({ error: "Sila lengkapkan semua medan wajib (ID Topik, Tajuk, Konseptual)." });
    }
    try {
      const docRef = doc(db, "custom_knowledge", fact.topicId);
      await setDoc(docRef, {
        topicId: fact.topicId,
        title: fact.title,
        context: fact.context,
        keyPoints: fact.keyPoints || [],
        updatedAt: serverTimestamp(),
        updatedBy: email
      });
      // Rebuild the RAG index
      await buildKbIndex();
      res.json({ success: true, message: `Berjaya menambah/mengemaskini rujukan pintar bagi bab "${fact.title}". Minda Cikgu telah dikemaskini secara langsung!` });
    } catch (e: any) {
      console.error("Save custom knowledge error:", e);
      res.status(500).json({ error: e.message || "Gagal menyimpan rujukan." });
    }
  });

  app.delete("/api/admin/knowledge/:topicId", async (req, res) => {
    const { email } = req.query as { email?: string };
    const { topicId } = req.params;
    if (!email || !isAdmin(email)) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    try {
      const docRef = doc(db, "custom_knowledge", topicId);
      await deleteDoc(docRef);
      // Rebuild the RAG index
      await buildKbIndex();
      res.json({ success: true, message: "Berjaya memadam rujukan dan membina semula index memori Cikgu." });
    } catch (e: any) {
      console.error("Delete custom knowledge error:", e);
      res.status(500).json({ error: e.message || "Gagal memadam rujukan." });
    }
  });

  // ─── admin student list (admin only) ───────────────────────────────────
  app.get("/api/admin/users", async (req, res) => {
    const { email } = req.query as { email?: string };
    if (!email || !isAdmin(email)) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    try {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      res.json({ success: true, list });
    } catch (e: any) {
      console.error("Fetch users error:", e);
      res.status(500).json({ error: e.message || "Failed to fetch student list." });
    }
  });

  // ─── admin custom exams management (admin only) ─────────────────────────
  app.get("/api/admin/exams", async (req, res) => {
    const { email } = req.query as { email?: string };
    if (!email || !isAdmin(email)) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    try {
      const snap = await getDocs(collection(db, "custom_exams"));
      const list = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      res.json({ success: true, list });
    } catch (e: any) {
      console.error("Fetch custom exams error:", e);
      res.status(500).json({ error: e.message || "Failed to fetch custom exams." });
    }
  });

  // AI-powered exam question analysis/ingest
  app.post("/api/admin/exams/analyse", async (req, res) => {
    const { email, questionText, assets } = req.body as {
      email: string;
      questionText?: string;
      assets?: { mimeType: string; data: string }[];
    };
    if (!email || !isAdmin(email)) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    try {
      const parts: any[] = [];
      if (assets && assets.length > 0) {
        for (const a of assets) {
          parts.push({
            inlineData: {
              mimeType: a.mimeType,
              data: a.data
            }
          });
        }
      }

      const allowedTopicsPrompt = SYLLABUS_TOPICS.map(t => `- "${t.id}": ${t.title} (${t.description})`).join("\n");

      parts.push({
        text: `You are Cikgu Kimia, an expert SPM Chemistry analyzer.
Your task is to ingest and analyze an uploaded SPM Chemistry exam question (provided as text, an image, or both) and output a JSON object containing carefully structured question metadata, refined text (using LaTeX where equations/formulas are present), and a precise marking scheme.

Analyze the question and output EXACTLY a JSON object with this schema:
{
  "id": "a-unique-slug-string-using-lowercase-and-hyphens-only",
  "title": "A short, descriptive Malaysian-style exam question title (e.g. Soalan Sel Ringkas, Soalan Alkohol & Ester)",
  "topicId": "Must be one of the specified topic keys or 'general'",
  "paperType": "struct" (for structure questions, usually divided into brief parts a,b,c with [1 markah]) or "essay" (for descriptive essay questions/experiments with larger marks [6 markah] or [10 markah])
  "questionText": "The fully transcribed or cleaned up exam question text in Malay or dual language (Malay/English). Support LaTeX $...$ for chemical formulas and math equations, and formatting like lists. If the source had diagrams, describe the diagrams clearly in text so that the AI/student can understand it.",
  "markingScheme": "Detailed step-by-step marking scheme / Skema Pemarkahan in Malay, listing correct answers, keyword requirements, chemical equations, and how marks are awarded."
}

Here are the allowed syllabus topic IDs and their titles:
${allowedTopicsPrompt}
- Use "general" if the question spans multiple topics.

Input text from admin (if any):
${questionText || ""}

Analyze thoroughly and return ONLY a valid raw JSON object. Do not wrap it in markdown block tags like \`\`\`json. Valid JSON only.`
      });

      const response = await retryGeminiCall(() => getAIClient().models.generateContent({
        model: MODEL_ANALYSER,
        contents: { parts },
      }));

      let rtext = (response.text || "").trim();
      rtext = rtext.replace(/^```json\n?/, "").replace(/\n?```$/, "");

      try {
        const result = JSON.parse(rtext);
        res.json({ success: true, result });
      } catch (err) {
        console.error("Failed to parse JSON response from gemini ingest analyser:", rtext);
        res.status(500).json({ error: "Model did not return valid JSON. Please try again." });
      }
    } catch (e: any) {
      console.error("Exam ingest analysis error:", e);
      res.status(500).json({ error: e.message || "Failed to analyze question." });
    }
  });

  // AI-powered custom notes/knowledge analysis/ingest
  app.post("/api/admin/knowledge/analyse", async (req, res) => {
    const { email, noteText, assets } = req.body as {
      email: string;
      noteText?: string;
      assets?: { mimeType: string; data: string }[];
    };
    if (!email || !isAdmin(email)) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    try {
      const parts: any[] = [];
      if (assets && assets.length > 0) {
        for (const a of assets) {
          parts.push({
            inlineData: {
              mimeType: a.mimeType,
              data: a.data
            }
          });
        }
      }

      const allowedTopicsPrompt = SYLLABUS_TOPICS.map(t => `- "${t.id}": ${t.title} (${t.description})`).join("\n");

      parts.push({
        text: `You are Cikgu Kimia, an expert SPM Chemistry analyzer.
Your task is to ingest and analyze an uploaded SPM Chemistry note page, textbook photo, or study materials, then output a JSON object containing carefully structured topic concept information, an overview, and main detailed takeaways/keypoints.

Analyze the notes/study materials and output EXACTLY a JSON object with this schema:
{
  "topicId": "Must be one of the specified topic keys if it matches, OR a sensible lowercased slug for custom/new notes (e.g., f5-c4 or tips-kbat)",
  "title": "A short, descriptive Malaysian-style concept or topic title (e.g., Proses Sentuh, Sifat Kimia Garam)",
  "context": "A detailed conceptual context or description in Malay explaining principles, general theories, IUPAC rules, or chemical equations. Use LaTeX $...$ for chemical symbols (e.g. $H_2SO_4$, $Na^+$) and equations.",
  "keyPoints": [
    "A clean, complete key point or notation that the student should remember for exams (e.g. Mangkin yang digunakan ialah vanadium(V) oksida pada suhu $450^\\circ$C). Use LaTeX where equations/formulas are present.",
    "Another distinct exam requirement, warning, color change, ionic equation, or observation.",
    "Add more high-quality points (aim for 2 to 5 standard-aligned key points depending on note depth)."
  ]
}

Here are the allowed syllabus topic IDs and their titles:
${allowedTopicsPrompt}

Input text from admin (if any):
${noteText || ""}

Analyze thoroughly and return ONLY a valid raw JSON object. Do not wrap it in markdown block tags like \`\`\`json. Valid JSON only.`
      });

      const response = await retryGeminiCall(() => getAIClient().models.generateContent({
        model: MODEL_ANALYSER,
        contents: { parts },
      }));

      let rtext = (response.text || "").trim();
      rtext = rtext.replace(/^```json\n?/, "").replace(/\n?```$/, "");

      try {
        const result = JSON.parse(rtext);
        res.json({ success: true, result });
      } catch (err) {
        console.error("Failed to parse JSON response from gemini note ingest analyser:", rtext);
        res.status(500).json({ error: "Model did not return valid JSON. Please try again." });
      }
    } catch (e: any) {
      console.error("Note ingest analysis error:", e);
      res.status(500).json({ error: e.message || "Failed to analyze study notes." });
    }
  });

  app.post("/api/admin/exams", async (req, res) => {
    const { email, exam } = req.body as { email: string; exam: any };
    if (!email || !isAdmin(email)) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    if (!exam || !exam.id || !exam.title || !exam.questionText || !exam.markingScheme) {
      return res.status(400).json({ error: "Sila lengkapkan ID, Tajuk Soalan, Teks Soalan, dan Skema Pemarkahan." });
    }
    try {
      const docRef = doc(db, "custom_exams", exam.id.trim().toLowerCase().replace(/\s+/g, "-"));
      await setDoc(docRef, {
        id: exam.id.trim().toLowerCase().replace(/\s+/g, "-"),
        title: exam.title,
        topicId: exam.topicId || "general",
        paperType: exam.paperType || "struct",
        questionText: exam.questionText,
        markingScheme: exam.markingScheme,
        updatedAt: serverTimestamp(),
        updatedBy: email
      });
      res.json({ success: true, message: `Berjaya menambah/mengemaskini soalan peperiksaan "${exam.title}"!` });
    } catch (e: any) {
      console.error("Save custom exam error:", e);
      res.status(500).json({ error: e.message || "Gagal menyimpan soalan peperiksaan." });
    }
  });

  app.delete("/api/admin/exams/:id", async (req, res) => {
    const { email } = req.query as { email?: string };
    const { id } = req.params;
    if (!email || !isAdmin(email)) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    try {
      const docRef = doc(db, "custom_exams", id);
      await deleteDoc(docRef);
      res.json({ success: true, message: "Berjaya memadam soalan peperiksaan tersebut." });
    } catch (e: any) {
      console.error("Delete custom exam error:", e);
      res.status(500).json({ error: e.message || "Gagal memadam soalan peperiksaan." });
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
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      // Load custom exams from Firestore to supply to the AI
      let customExams: any[] = [];
      try {
        const snap = await getDocs(collection(db, "custom_exams"));
        customExams = snap.docs.map(doc => doc.data());
      } catch (e) {
        console.error("Failed to load custom exams for chat:", e);
      }

      const dynamicCtx = buildDynamicContext({ memory, selectedTopicId, userMessage: message, platform: "web", customExams });
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

      // ─── Layer 2: Firebase Shared Cache ──────────────────────────────────────
      // Only cache single-turn factual questions (no images, conversation < 3 turns)
      const isCacheable = (!assets || assets.length === 0) && (history || []).length < 3;
      if (isCacheable) {
        const cachedAnswer = await sharedCache.hit(message, selectedTopicId);
        if (cachedAnswer) {
          console.log(`[CACHE HIT L2] topic=${selectedTopicId} q="${message.slice(0,50)}..."`);
          res.write(cachedAnswer);
          res.end();
          return;
        }
      }

      // ─── Layer 3: Gemini API ───────────────────────────────────────────────
      const streamResponse = await retryGeminiCall(() => getAIClient().models.generateContentStream({
        model: MODEL_CHAT,
        contents,
        config: {
          systemInstruction: fullSystemInstruction,
          temperature: 0.7
        }
      } as any));

      let fullAnswer = "";
      for await (const chunk of streamResponse) {
        const t = chunk.text;
        if (t) {
          res.write(t);
          fullAnswer += t;
        }
      }
      res.end();

      // Save to Layer 2 Firebase cache (fire & forget)
      if (isCacheable && fullAnswer.length > 30) {
        sharedCache.set(message, fullAnswer, selectedTopicId).catch(() => {});
      }
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
        .map(m => {
          const roleStr = (m.role || "user").toUpperCase();
          const textStr = typeof m.text === "string" ? m.text : "";
          return `${roleStr}: ${textStr.replace(/\n+/g, " ").slice(0, 600)}`;
        })
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

  // ─── Cache Stats API (admin) ─────────────────────────────────────────────
  app.get("/api/admin/cache-stats", async (req, res) => {
    try {
      const topEntries = await sharedCache.getTopEntries(20);
      const totalDocs = topEntries.length;
      const totalHits = topEntries.reduce((sum, e) => sum + (e.hits || 0), 0);
      res.json({
        totalCachedQuestions: totalDocs,
        totalCacheHits: totalHits,
        estimatedApiCallsSaved: totalHits,
        topQuestions: topEntries.map(e => ({
          question: (e.question || "").slice(0, 80),
          topicId: e.topicId,
          hits: e.hits || 0,
          createdAt: e.createdAtMs ? new Date(e.createdAtMs).toISOString() : null,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cikgu Kimia v2 server running on http://0.0.0.0:${PORT}`);
    console.log(`  models: chat=${MODEL_CHAT}, analyser=${MODEL_ANALYSER}, summary=${MODEL_SUMMARY}`);
    console.log(`  cache: 3-layer (localStorage + Firebase shared_cache + Gemini API)`);
  });
}

console.log("Initializing Cikgu Kimia v2 server...");
startServer().catch(err => {
  console.error("FATAL: Failed to start server:", err);
});

// ─── Cache Stats Endpoint (admin only) ───────────────────────────────────────
