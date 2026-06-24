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
import { SYLLABUS_TOPICS, ALL_TOPICS, SUBJECTS } from "./src/constants";
import { Telegraf, Markup } from "telegraf";
import { db } from "./src/lib/firebase";
import { collection, addDoc, query, orderBy, limit, getDocs, getDoc, serverTimestamp, doc, setDoc, deleteDoc } from "firebase/firestore";

import { SYLLABUS_KNOWLEDGE_BASE } from "./src/data/syllabus_kb.ts";
import { EXAM_PAPERS, buildFrequencyIndex } from "./src/data/examFrequency.ts";
import { EXAM_ANSWERS_KB, formatAnswersForPrompt } from "./src/data/examAnswersKb.ts";

// ─── config ───────────────────────────────────────────────────────────────
const WEB_APP_URL =
  process.env.APP_URL ||
  "https://ais-pre-plschybuw4bxx5jgbdpsgu-244423792092.asia-southeast1.run.app";

// Models — tunable via env so you can roll back without code changes
const MODEL_CHAT     = process.env.GEMINI_MODEL_CHAT     || "gemini-2.5-flash";
const MODEL_ANALYSER = process.env.GEMINI_MODEL_ANALYSER || "gemini-2.5-flash";
const MODEL_SUMMARY  = process.env.GEMINI_MODEL_SUMMARY  || "gemini-2.5-flash";

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

function isTopicInSubject(topicId: string, subjectId?: string): boolean {
  if (!topicId) return false;
  if (!subjectId) return true; // if no subject context, assume valid
  const subId = subjectId.toLowerCase();
  const subjectObj = SUBJECTS.find(s => s.id === subId);
  if (subjectObj && subjectObj.topics && subjectObj.topics.some(t => t.id === topicId)) {
    return true;
  }
  if (subId === "chemistry" && (topicId.includes("-c") || topicId.startsWith("f4-c") || topicId.startsWith("f5-c"))) return true;
  if (subId === "physics" && (topicId.includes("-p") || topicId.startsWith("f4-p") || topicId.startsWith("f5-p"))) return true;
  if (subId === "biology" && (topicId.includes("-b") || topicId.startsWith("f4-b") || topicId.startsWith("f5-b"))) return true;
  return false;
}

function ragMatch(userMessage?: string, selectedTopicId?: string, selectedSubjectId?: string): KbEntry | null {
  if (userMessage) {
    const q = userMessage.toLowerCase();
    // 1st pass: Exact contains matching WITH active subject constraint
    if (selectedSubjectId) {
      for (const [keyword, entry] of kbKeywordIndex) {
        if (q.includes(keyword) && entry.topicId !== selectedTopicId && isTopicInSubject(entry.topicId, selectedSubjectId)) {
          return entry;
        }
      }
    }
    // 2nd pass: Exact contains matching without active subject constraint (fallback)
    for (const [keyword, entry] of kbKeywordIndex) {
      if (q.includes(keyword) && entry.topicId !== selectedTopicId) {
        return entry;
      }
    }
  }
  if (selectedTopicId) {
    const hit = kbByTopicId.get(selectedTopicId);
    if (hit) return hit;
  }
  if (userMessage) {
    const q = userMessage.toLowerCase();
    // 3rd pass: Keyword includes user query with subject constraint
    if (selectedSubjectId) {
      for (const [keyword, entry] of kbKeywordIndex) {
        if (keyword.includes(q) && q.length > 3 && isTopicInSubject(entry.topicId, selectedSubjectId)) {
          return entry;
        }
      }
    }
    // 4th pass: Keyword includes user query without subject constraint
    for (const [keyword, entry] of kbKeywordIndex) {
      if (keyword.includes(q) && q.length > 3) {
        return entry;
      }
    }
  }
  return null;
}

// ─── system prompts: static (cached) + dynamic (per-request) ──────────────
const SUBJECT_REGISTRY: Record<string, {
  name: string;
  codename: string;
  syllabusSummary: string;
  insights: string[];
  tips: string;
}> = {
  chemistry: {
    name: "Cikgu Kimia",
    codename: "Kimia",
    syllabusSummary: "Tingkatan 4:\n- Bab 2: Jirim & Struktur Atom\n- Bab 3: Konsep Mol, Formula & Persamaan\n- Bab 4: Jadual Berkala Unsur\n- Bab 5: Ikatan Kimia\n- Bab 6: Asid, Bes & Garam\n- Bab 7: Kadar Tindak Balas\n- Bab 8: Bahan Buatan dlm Industri\n\nTingkatan 5:\n- Bab 1: Keseimbangan Redoks\n- Bab 2: Sebatian Karbon\n- Bab 3: Termokimia\n- Bab 4: Polimer\n- Bab 5: Kimia Pengguna & Industri",
    insights: [
      "Kadar Tindak Balas: Pelajar sering terlepas terma 'frekuensi pelanggaran BERKESAN'.",
      "Termokimia: Jawapan mestilah mengandungi cas (+/-) dan unit (kJ mol⁻¹).",
      "Redox: Kaedah 'AN OX' + 'RED CAT' amat membantu pengecaman elektrod penderma/penerima elektron.",
      "Penyediaan Garam: Sentiasa semak keterlarutan garam bagi menentukan tindak balas pemendakan atau peneutralan."
    ],
    tips: "Tegaskan penulisan persamaan kimia seimbang, formula kimia ion yang betul, dan pengiraan stoikiometri menggunakan bilangan mol secara tepat."
  },
  physics: {
    name: "Cikgu Fizik",
    codename: "Fizik",
    syllabusSummary: "Tingkatan 4:\n- Bab 1: Pengukuran\n- Bab 2: Daya & Gerakan I\n- Bab 3: Kegravitian\n- Bab 4: Haba\n- Bab 5: Gelombang\n- Bab 6: Cahaya & Optik\n\nTingkatan 5:\n- Bab 1: Daya & Gerakan II\n- Bab 2: Tekanan\n- Bab 3: Elektrik\n- Bab 4: Keelektromagnetan\n- Bab 5: Elektronik\n- Bab 6: Fizik Nuklear\n- Bab 7: Fizik Kuantum",
    insights: [
      "Daya dan Gerakan: Perlu membezakan antara jisim (kg) dengan berat (N). Jelaskan inersia dengan hubungkait jisim.",
      "Haba: Sentiasa bezakan haba pendam tentu dengan muatan haba tentu.",
      "Cahaya & Optik: Pastikan rajah sinar menunjukkan anak panah cahaya dan kedudukan titik fokus F serta pusat optik O secara tepat.",
      "Keelektromagnetan: Gunakan Peraturan Tangan Kanan Fleming untuk arah daya/arus aruhan."
    ],
    tips: "Tegaskan pemahaman konsep fizik, leraian daya (F cos theta, F sin theta), litar elektrik selari/siri, dan penggunaan unit SI m/s², kg, N, J, W, Pa secara konsisten."
  },
  biology: {
    name: "Cikgu Biologi",
    codename: "Biologi",
    syllabusSummary: "Tingkatan 4:\n- Bab 2: Biologi Sel & Organisasi Sel\n- Bab 3: Pergerakan Bahan Merentasi Membran\n- Bab 4: Komposisi Kimia dlm Sel\n- Bab 5: Metabolisme & Enzim\n- Bab 6: Pembahagian Sel\n- Bab 7: Respirasi Sel\n- Bab 8: Sistem Respirasi\n- Bab 9: Nutrisi & Sistem Pencernaan\n- Bab 10: Pengangkutan dlm Manusia\n\nTingkatan 5:\n- Bab 1: Organisasi Tisu Tumbuhan & Pertumbuhan\n- Bab 2: Struktur & Fungsi Daun\n- Bab 3: Nutrisi dlm Tumbuhan\n- Bab 4: Pengangkutan dlm Tumbuhan\n- Bab 5: Gerak Balas dlm Tumbuhan\n- Bab 6: Pembiakan Seks dlm Tumbuhan\n- Bab 7: Penyesuaian Habitat Tumbuhan\n- Bab 8: Biodiversiti\n- Bab 9: Ekosistem",
    insights: [
      "Biologi Sel: Label organel dengan betul dan nyatakan peranan Mitokondria/Kloroplas secara kritis.",
      "Enzim: Huraikan hipotesis 'mangga dan kunci' serta faktor suhu/pH terhadap struktur tapak aktif enzim.",
      "Pembahagian Sel: Terangkan proses pindah silang (crossing over) semasa Profasa I Meiosis untuk variasi genetik.",
      "Sistem Keimunan: Bezakan keimunan aktif semula jadi dengan keimunan pasif buatan."
    ],
    tips: "Gunakan istilah saintifik/biologi yang tepat (e.g. krenasi, hemolisis, plasmolisis), jelaskan perkaitan struktur dengan fungsi organ/tisu, dan tulis nama saintifik organisma mengikut konvensyen binomial (bergaris secara berasingan)."
  }
};

function buildSystemInstruction(selectedSubjectId?: string): string {
  const subjectId = (selectedSubjectId || "chemistry").toLowerCase();
  const registryObj = SUBJECT_REGISTRY[subjectId] || SUBJECT_REGISTRY.chemistry;
  
  return `You are "${registryObj.name}", an expert KSSM SPM ${registryObj.codename} tutor (also addressed as "Cikgu").

Mission:
1. LANGUAGE: respond in the EXACT same language the student uses (Malay if they wrote Malay; English if English; mixed only if they mixed).
2. Ground every answer in the official KSSM SPM syllabus.
3. Equations: use LaTeX symbols (e.g., $H_2O$, $v = u + at$, $E = mc^2$).
4. IMPORTANT: When explaining an answer, you MUST prioritize the logic, keywords, and marking points defined in the provided 'Skema Pemarkahan' / 'Marking Scheme' for that specific question/topic. Do not just explain conceptually; align your steps with the skema's criteria. If the skema highlights a specific way to state a fact, you must use that phrasing (e.g. if the skema requires "frequency of effective collisions", do not accept "frequency of collisions"). Flag ⚠ common errors proactively as noted in the skema.
5. VISUAL AIDS: for electrolysis / titration / atomic structure / ray diagrams / electrical circuits / cellular structures, embed an SVG inside a markdown block with language "svg":
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

STUDENT MASTERY SYSTEM & AGENTIC ACTIONS:
- You have access to real educational tool calls: 'update_student_mastery_level' and 'record_learning_pitfall'.
- Use 'update_student_mastery_level' when the student answers correctly, demonstrates master understanding (+10 to +20) or repetitive basic error (-5 to -10).
- Use 'record_learning_pitfall' when you spot a concrete misconception or mistake the student made in their understanding.
- When calling tools, explain context and continue explaining or responding to the user naturally.

KSSM SYLLABUS:
${registryObj.syllabusSummary}

GLOBAL INSIGHTS:
${registryObj.insights.map(i => `- ${i}`).join("\n")}

TUTOR SPECIFIC TIPS:
${registryObj.tips}

SPM MARKING SCHEME GUIDELINES:
${MARKING_SCHEME_TIPS.map(t => `Topic: ${t.topic}\nKeywords: ${t.requiredKeywords.join(", ")}\nLogic: ${t.markingSchemeLogic}`).join("\n\n")}

SPM PAST YEAR EXAM ANSWERS (use these as ground truth when students ask about these topics):
When a student's question matches a topic below, prioritise these exact marking scheme answers.
Always highlight ⚠ common errors when relevant.

${formatAnswersForPrompt()}`;
}

const STATIC_INSTRUCTION = buildSystemInstruction("chemistry");

const TELEGRAM_TAIL = `
TELEGRAM:
- Diagrams will be hidden — use a short ascii/emoji sketch as fallback.
- Use Markdown **bold** / *italic*, not HTML tags.
- Make replies punchy, structured with bullets.`;

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
  selectedSubjectId?: string;
}): string {
  const { memory, selectedTopicId, userMessage, platform, customExams, selectedSubjectId } = args;

  const memBits: string[] = [];
  if (memory?.weakTopics?.length) memBits.push(`Student's weak topics: ${memory.weakTopics.join(", ")}`);
  if (memory?.identifiedMistakes?.length) memBits.push(`Past mistakes: ${memory.identifiedMistakes.slice(-5).join("; ")}`);
  if (memory?.examPapersAnalysis?.length) memBits.push(`Recent exam paper notes:\n${memory.examPapersAnalysis.slice(-3).join("\n")}`);

  const hit = ragMatch(userMessage, selectedTopicId, selectedSubjectId);
  const ragBlock = hit
    ? `Most-relevant chapter for this turn — ${hit.title}:\n${hit.context}\nKey points:\n- ${hit.keyPoints.join("\n- ")}`
    : selectedTopicId
      ? `Current topic context: ${selectedTopicId}.`
      : "";

  const pieces: string[] = [];
  if (ragBlock) pieces.push(ragBlock);
  if (memBits.length) pieces.push(`Student context:\n${memBits.join("\n")}`);
  if (platform === "telegram") pieces.push(TELEGRAM_TAIL);

  if (customExams && customExams.length > 0) {
    const examDescriptions = customExams.map(ex => {
      let paperLabel = "Kertas 2 - Esei";
      if (ex.paperType === "struct") paperLabel = "Kertas 2 - Struktur";
      else if (ex.paperType === "kertas_1") paperLabel = "Kertas 1 - Objektif";
      
      return `[Exam Question ID: ${ex.id}, Topic: ${ex.topicId || "any"}, Paper Type: ${paperLabel}]
Title: ${ex.title}
Question:
${ex.questionText}
Marking Scheme / Expected Answers:
${ex.markingScheme}`;
    }).join("\n\n---\n\n");
    
    pieces.push(`ADMIN-DEFINED EXAM QUESTIONS POOL:\nUse the following exact exam questions when the student initiates an exam session or practice (e.g. topicId starts with "exam", like "exam-struct" or "exam-essay") or asks to do exam exercises related to the topic of these questions. Avoid generating generic questions if there are custom ones below matching the topic / requested paper type! Always grade and correct the student's answer using the specific Marking Scheme provided. Do NOT reveal the marking scheme or correct answers until the user makes their attempt.\n\n${examDescriptions}`);
  }

  // Inject topic-specific past year exam answers for more precise grounding
  if (selectedTopicId) {
    const topicExamAnswers = formatAnswersForPrompt(selectedTopicId);
    if (topicExamAnswers) {
      pieces.push(`PAST YEAR SKEMA FOR THIS TOPIC (${selectedTopicId}):\nUse these exact marking scheme answers when grading or explaining. Flag ⚠ common errors proactively.\n\n${topicExamAnswers}`);
    }
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
  const PORT = parseInt(process.env.PORT || "3000", 10);
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

    bot.command("link", async (ctx) => {
      try {
        const code = Math.random().toString(36).slice(2, 8).toUpperCase();
        await setDoc(doc(db, "telegram_link_codes", code), {
          chatId: ctx.from.id,
          createdAt: serverTimestamp(),
        });
        await ctx.reply(
          `Tunjuk kod ini di aplikasi web untuk pasangkan akaun anda:\n\n<b>${code}</b>\n\nKod tamat tempoh dalam 5 minit.`,
          { parse_mode: "HTML" }
        );
      } catch (err) {
        console.error("TG /link error:", err);
        await ctx.reply("Maaf, terdapat ralat semasa menjana kod pautan.");
      }
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

  // ─── cron reminders (Option B) ──────────────────────────────────────────
  app.get("/api/cron/send-reminders", async (req, res) => {
    const { secret } = req.query;
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || secret !== cronSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      console.log("[CRON] Running sendDailyReminders job...");
      const snap = await getDocs(collection(db, "users"));
      let sentCount = 0;

      for (const userDoc of snap.docs) {
        const u = userDoc.data();
        const prefs = u.reminderPrefs;
        if (!prefs || prefs.channel === "off") continue;

        const lastActive = u.lastActiveDay
          ? Math.floor((Date.now() - Date.parse(u.lastActiveDay)) / 86_400_000)
          : 999;

        // Only nudge users gone 2–14 days; don't pester active users or fully-lapsed ones
        if (lastActive < 2 || lastActive > 14) continue;

        // Don't double-send within 24h
        if (prefs.lastSent && Date.now() - prefs.lastSent < 24 * 60 * 60 * 1000) continue;

        // Match preferredHour (default: 19 / 7 PM MYT)
        const preferredHour = typeof prefs.preferredHour === "number" ? prefs.preferredHour : 19;
        const currentHourMYT = new Date(Date.now() + 8 * 60 * 60 * 1000).getUTCHours();
        
        // If query param 'force=true' is passed, skip hour check (handy for testing)
        if (req.query.force !== "true" && currentHourMYT !== preferredHour) {
          continue;
        }

        const weakTopic = (u.weakTopics ?? [])[0];
        const message = weakTopic
          ? `🧪 Anda tinggalkan bab *${weakTopic}* ${lastActive} hari lepas dlm Cikgu AI. Cuba 3 soalan ringkas hari ini? 📝\n\n${WEB_APP_URL}`
          : `🧪 Sudah ${lastActive} hari anda tidak belajar dlm Cikgu AI. Jom teruskan streak belajar anda hari ini! 🔥\n\n${WEB_APP_URL}`;

        if (prefs.channel === "telegram" && prefs.telegramChatId) {
          if (bot) {
            try {
              await bot.telegram.sendMessage(prefs.telegramChatId, message, { parse_mode: "Markdown" });
            } catch (err) {
              console.error(`[CRON] Fail to send Telegram to ${prefs.telegramChatId}:`, err);
            }
          }
        }

        const updatedPrefs = {
          ...prefs,
          lastSent: Date.now()
        };
        await setDoc(doc(db, "users", userDoc.id), { reminderPrefs: updatedPrefs }, { merge: true });
        sentCount++;
      }

      res.json({ success: true, sentCount });
    } catch (error: any) {
      console.error("[CRON] Error sending reminders:", error);
      res.status(500).json({ error: error.message || String(error) });
    }
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
  // Supports TWO assets: assets[0] = kertas soalan, assets[1] = skema (optional)
  // If both provided, Gemini matches questions with answers automatically
  app.post("/api/admin/exams/analyse", async (req, res) => {
    const { email, questionText, assets, subjectId } = req.body as {
      email: string;
      questionText?: string;
      assets?: { mimeType: string; data: string; label?: string }[];
      subjectId?: string;
    };
    if (!email || !isAdmin(email)) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    const MAX_ASSET_B64 = Math.ceil((10 * 1024 * 1024) / 3) * 4; // ~10 MB raw → base64
    if (assets !== undefined) {
      if (!Array.isArray(assets) || assets.length > 5) {
        return res.status(400).json({ error: "assets must be an array of at most 5 files." });
      }
      for (const a of assets) {
        if (!ALLOWED_MIME.includes(a.mimeType)) {
          return res.status(400).json({ error: `File type not allowed: ${a.mimeType}` });
        }
        if (typeof a.data !== "string" || a.data.length > MAX_ASSET_B64) {
          return res.status(400).json({ error: "A file exceeds the 10 MB size limit." });
        }
      }
    }
    try {
      const parts: any[] = [];
      const hasDualPdf = assets && assets.length >= 2;

      if (assets && assets.length > 0) {
        // Label documents for Gemini when dual PDF mode
        if (hasDualPdf) {
          parts.push({ text: "DOCUMENT 1 — KERTAS SOALAN (exam question paper):" });
          parts.push({ inlineData: { mimeType: assets[0].mimeType, data: assets[0].data } });
          parts.push({ text: "DOCUMENT 2 — SKEMA PEMARKAHAN (marking scheme):" });
          parts.push({ inlineData: { mimeType: assets[1].mimeType, data: assets[1].data } });
        } else {
          for (const a of assets) {
            parts.push({ inlineData: { mimeType: a.mimeType, data: a.data } });
          }
        }
      }

      const subId = (subjectId || "chemistry").toLowerCase();
      const subjectObj = SUBJECTS.find(s => s.id === subId) || SUBJECTS[0];
      const targetTopics = subjectObj ? subjectObj.topics : ALL_TOPICS;
      const allowedTopicsPrompt = targetTopics.map(t => `- "${t.id}": ${t.title} (${t.description})`).join("\n");

      const dualInstruction = hasDualPdf
        ? `You have TWO documents above:
- DOCUMENT 1: Kertas Soalan (exam questions)
- DOCUMENT 2: Skema Pemarkahan (marking scheme / answer key)

Extract EVERY main question from the kertas soalan (Q1, Q2, Q3... etc).
For each question, find its EXACT matching answers from the skema pemarkahan.
Combine them into one structured entry per question number.`
        : `You have ONE document. Extract all questions and transcribe/generate the marking scheme.`;

      parts.push({
        text: `You are ${subjectObj.name}, an expert SPM ${subjectObj.codename} analyzer.
${dualInstruction}

Output EXACTLY a JSON ARRAY where each element represents one main question:
[
  {
    "id": "unique-slug e.g. penang-2022-s2-q1",
    "title": "Short descriptive title e.g. Hukum Hooke / Mitokondria",
    "topicId": "one of the allowed topic IDs or general",
    "paperType": "struct (parts a,b,c small marks) or essay (10-20 marks)",
    "questionText": "Full question text in Malay. Use LaTeX $...$ for formulas. Describe diagrams/tables in text. Include all sub-parts (a)(b)(c) with their mark allocations.",
    "markingScheme": "Exact mark-by-mark answers from skema. List each point clearly with marks. Include required keywords, equations, common error warnings."
  }
]

Allowed topic IDs:
${allowedTopicsPrompt}

Admin notes: ${questionText || "none"}

Return ONLY a valid raw JSON array. No markdown fences. No explanation.`
      });

      const response = await retryGeminiCall(() => getAIClient().models.generateContent({
        model: MODEL_ANALYSER,
        contents: { parts },
      }));

      let rtext = (response.text || "").trim();
      rtext = rtext.replace(/^```json\n?/, "").replace(/\n?```$/, "");

      try {
        const parsed = JSON.parse(rtext);
        // Normalise: always return array
        const result = Array.isArray(parsed) ? parsed : [parsed];
        res.json({ success: true, result, count: result.length });
      } catch (err) {
        console.error("Failed to parse JSON response from gemini exam analyser:", rtext);
        res.status(500).json({ error: "Model did not return valid JSON. Please try again." });
      }
    } catch (e: any) {
      console.error("Exam ingest analysis error:", e);
      res.status(500).json({ error: e.message || "Failed to analyze question." });
    }
  });

  // AI-powered custom notes/knowledge analysis/ingest
  app.post("/api/admin/knowledge/analyse", async (req, res) => {
    const { email, noteText, assets, subjectId } = req.body as {
      email: string;
      noteText?: string;
      assets?: { mimeType: string; data: string }[];
      subjectId?: string;
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

      // Determine subject name and topics to prevent cross-subject hallucination
      const subId = (subjectId || "chemistry").toLowerCase();
      const subjectObj = SUBJECTS.find(s => s.id === subId) || SUBJECTS[0];
      const targetTopics = subjectObj ? subjectObj.topics : ALL_TOPICS;
      const allowedTopicsPrompt = targetTopics.map(t => `- "${t.id}": ${t.title} (${t.description})`).join("\n");
      const codename = subjectObj ? subjectObj.codename : "Kimia, Fizik, dan Biologi";

      parts.push({
        text: `You are Cikgu AI, an expert SPM ${codename} textbook and note analyzer.
Your task is to ingest and analyze an uploaded SPM note page, textbook photo, or study materials for the subject ${codename}, then output a JSON object containing carefully structured topic concept information, an overview, and main detailed takeaways/keypoints.

Analyze the notes/study materials and output EXACTLY a JSON object with this schema:
{
  "topicId": "Must be one of the specified topic keys if it matches (e.g., f4-c3 for chemistry, f4-p2 for physics, f4-b2 for biology), OR a sensible lowercased slug for custom/new notes (e.g., f4-p1-formula, tips-kbat)",
  "title": "A short, descriptive Malaysian-style concept or topic title (e.g., Hukum Kegravitian Newton, Fungsi Mitokondria, Sifat Kimia Garam)",
  "context": "A detailed conceptual context or description in Malay explaining principles, general theories, KSSM syllabus definitions, IUPAC rules, or equations. Use LaTeX $...$ for mathematical/chemical symbols (e.g. $v = u + at$, $H_2SO_4$, $Na^+$) and equations.",
  "keyPoints": [
    "A clean, complete key point or notation that the student should remember for exams (e.g. Suhu tidak berubah semasa takat lebur kerana haba digunakan untuk mengatasi daya tarikan zarah). Use LaTeX where equations/formulas are present.",
    "Another distinct exam requirement, warning, formula application, definition of physical quantity, or observation.",
    "Add more high-quality points (aim for 2 to 5 standard-aligned key points depending on note depth)."
  ]
}

Here are the allowed syllabus topic IDs and their titles for the subjek ${codename}:
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
    const { message, assets, memory, history, selectedTopicId, selectedSubjectId } = req.body as {
      message: string;
      assets?: { mimeType: string; data: string }[];
      memory?: any;
      history?: any[];
      selectedTopicId?: string;
      selectedSubjectId?: string;
    };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required." });
    }
    if (selectedSubjectId) {
      const validSubjectIds = SUBJECTS.map(s => s.id);
      if (!validSubjectIds.includes(selectedSubjectId)) {
        return res.status(400).json({ error: "Invalid subjectId." });
      }
    }
    if (selectedTopicId) {
      const validTopicIds = ALL_TOPICS.map(t => t.id);
      const isDynamic = selectedTopicId.includes("-quiz") || selectedTopicId.includes("-exam");
      if (!isDynamic && !validTopicIds.includes(selectedTopicId)) {
        return res.status(400).json({ error: "Invalid topicId." });
      }
    }

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

      const activeSubjectObj = SUBJECT_REGISTRY[selectedSubjectId || "chemistry"] || SUBJECT_REGISTRY.chemistry;
      const dynamicCtx = buildDynamicContext({ memory, selectedTopicId, userMessage: message, platform: "web", customExams, selectedSubjectId });
      const fullSystemInstruction = buildSystemInstruction(selectedSubjectId) + "\n\n" + dynamicCtx;

      const userParts: any[] = [];
      if (assets && assets.length > 0) {
        for (const a of assets) userParts.push({ inlineData: { mimeType: a.mimeType, data: a.data } });
      }
      userParts.push({ text: message || `Sila bincangkan topik ini berkaitan ${activeSubjectObj.codename} SPM.` });

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

      // Define agent/teacher tools for background data updates
      const declaredTools = [
        {
          functionDeclarations: [
            {
              name: "update_student_mastery_level",
              description: "Updates student progress mastery level (+10 to +20 for correct answers or shown mastery, -5 to -10 for consecutive mistakes). Only invoke this tool when you detect significant changes in learning status.",
              parameters: {
                type: "OBJECT",
                properties: {
                  topicId: { type: "STRING", description: "The KSSM topic ID (e.g. f4-c2, f4-p1, f5-b2)." },
                  delta: { type: "NUMBER", description: "The level increment or decrement relative to current state." },
                  reason: { type: "STRING", description: "Reason for updating mastery." }
                },
                required: ["topicId", "delta", "reason"]
              }
            },
            {
              name: "record_learning_pitfall",
              description: "Records a specific learning weakness, mistake or misconception made by the student.",
              parameters: {
                type: "OBJECT",
                properties: {
                  topicId: { type: "STRING", description: "The topic ID (e.g. f4-c2, f4-p1, f4-b2)." },
                  pitfallDescription: { type: "STRING", description: "A concise summary of the student's mistake or misconception." }
                },
                required: ["topicId", "pitfallDescription"]
              }
            }
          ]
        }
      ];

      let activeContents = [...contents];
      let maxToolLoops = 2;
      const aiClient = getAIClient();

      while (maxToolLoops > 0) {
        maxToolLoops--;

        // Run non-streaming call to check if tools are invoked
        const genResponse = await retryGeminiCall(() => aiClient.models.generateContent({
          model: MODEL_CHAT,
          contents: activeContents,
          config: {
            systemInstruction: fullSystemInstruction,
            temperature: 0.7,
            tools: declaredTools
          }
        } as any));

        const candidate = genResponse.candidates?.[0];
        const calls = candidate?.content?.parts?.filter(p => p.functionCall);

        if (calls && calls.length > 0) {
          console.log(`[AGENT_LOOP] Intercepted ${calls.length} function calls from Gemini.`);
          const toolResponses: any[] = [];

          for (const part of calls) {
            const call = part.functionCall;
            if (!call) continue;
            console.log(`[AGENT_LOOP] Invoking Tool: ${call.name}`, call.args);

            let result = { success: true, message: "Tool executed successfully." };

            try {
              if (call.name === "update_student_mastery_level") {
                const args = call.args as { topicId: string; delta: number; reason: string };
                if (memory?.uid && args.topicId) {
                  const userDocRef = doc(db, `users/${memory.uid}`);
                  const userSnap = await getDoc(userDocRef);
                  const currentMastery = userSnap.exists() ? (userSnap.data().mastery || {}) : {};
                  const oldVal = currentMastery[args.topicId] || 0;
                  const newVal = Math.max(0, Math.min(100, oldVal + (args.delta || 0)));
                  currentMastery[args.topicId] = newVal;

                  await setDoc(userDocRef, { mastery: currentMastery }, { merge: true });
                  console.log(`[AGENT_LOOP] Updated mastery for user ${memory.uid}: ${args.topicId} -> ${newVal}`);
                  result = { success: true, message: `Mastery level for ${args.topicId} updated to ${newVal}.` };
                } else {
                  result = { success: false, message: "No active student uid or topicId specified." };
                }
              } else if (call.name === "record_learning_pitfall") {
                const args = call.args as { topicId: string; pitfallDescription: string };
                if (memory?.uid && args.pitfallDescription) {
                  const userDocRef = doc(db, `users/${memory.uid}`);
                  const userSnap = await getDoc(userDocRef);
                  const currentMistakes = userSnap.exists() ? (userSnap.data().identifiedMistakes || []) : [];
                  if (!currentMistakes.includes(args.pitfallDescription)) {
                    currentMistakes.push(`${args.topicId || "general"}: ${args.pitfallDescription}`);
                    await setDoc(userDocRef, { identifiedMistakes: currentMistakes }, { merge: true });
                  }
                  console.log(`[AGENT_LOOP] Recorded pitfall for user ${memory.uid}: ${args.pitfallDescription}`);
                  result = { success: true, message: `Recorded pitfall successfully.` };
                } else {
                  result = { success: false, message: "No active student uid or description specified." };
                }
              }
            } catch (err: any) {
              console.error(`[AGENT_LOOP] Error executing tool ${call.name}:`, err);
              result = { success: false, message: `Error details: ${err.message || err}` };
            }

            toolResponses.push({
              functionResponse: {
                name: call.name,
                response: result
              }
            });
          }

          // Push the functionCalls & functionResponses to conversation context for subsequent generation
          activeContents.push({
            role: "model",
            parts: calls
          });
          activeContents.push({
            role: "user",
            parts: toolResponses
          });

        } else {
          // No tools called, or generation completed without tools
          break;
        }
      }

      // Stream the final conversational tutoring chunk by chunk
      const streamResponse = await retryGeminiCall(() => aiClient.models.generateContentStream({
        model: MODEL_CHAT,
        contents: activeContents,
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
    app.get("*", (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
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

  // ─── admin: get exam frequency for a topic ─────────────────────────────
  app.get("/api/admin/exam-frequency/:topicId", async (req, res) => {
    try {
      const snap = await getDoc(doc(db, "exam_frequency", req.params.topicId));
      if (!snap.exists()) return res.status(404).json({ error: "No data for this topic" });
      res.json(snap.data());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Smart Topic Greeting ─────────────────────────────────────────────────
  // GET  /api/topic-greeting?topicId=f4-c2   → check Firebase, return cached greeting
  // POST /api/topic-greeting                  → force-regenerate greeting for a topic (admin)
  app.get("/api/topic-greeting", async (req, res) => {
    const topicId = (req.query.topicId as string || "").trim();
    if (!topicId) return res.status(400).json({ error: "topicId required" });

    try {
      const greetingDoc = await getDoc(doc(db, "topic_greetings", topicId));
      if (greetingDoc.exists()) {
        return res.json({ greeting: greetingDoc.data().greeting, cached: true });
      }
      // Not cached — generate with Gemini
      const topic = ALL_TOPICS.find(t => t.id === topicId);
      if (!topic) return res.status(404).json({ error: "Topic not found" });

      const matchedSubject = SUBJECTS.find(s => s.topics.some(t => t.id === topicId)) || SUBJECTS[0];
      const matchedTutorName = matchedSubject.name;
      const matchedCodename = matchedSubject.codename;
      const emoji = matchedSubject.id === "chemistry" ? "🧪" : matchedSubject.id === "physics" ? "⚡" : "🧬";

      let kbSnippet = "";
      try {
        const factDoc = await getDoc(doc(db, "custom_facts", topicId));
        if (factDoc.exists()) {
          const fd = factDoc.data();
          kbSnippet = `${fd.title || ""}\n${fd.context || ""}\nKey Facts:\n- ${(fd.keyPoints || []).join("\n- ")}`;
        }
      } catch (e) {
        console.error("Failed to load custom fact for greeting:", e);
      }

      if (!kbSnippet) {
        const kb = SYLLABUS_KNOWLEDGE_BASE.find(t => t.topicId === topicId);
        kbSnippet = kb ? (typeof kb === "string" ? kb : JSON.stringify(kb)).slice(0, 1500) : "";
      }

      const subtopics = topic.subtopics?.join(", ") || "";

      // Get exam frequency data for this topic
      const freqIndex = buildFrequencyIndex();
      const freqData = freqIndex[topicId];
      const examFreqSection = freqData
        ? `Data exam past year (${freqData.papers.join(", ")}):
- Topik ini keluar ${freqData.appearances}x dengan jumlah ${freqData.totalMarks} markah
- Konsep kerap keluar: ${freqData.hotConcepts.slice(0, 4).join(", ")}
${freqData.highValueBahagian.length > 0 ? `- Bahagian bernilai tinggi: ${freqData.highValueBahagian.join("; ")}` : ""}`
        : "Tiada data exam frequency lagi untuk topik ini.";

      const prompt = `Kamu adalah ${matchedTutorName}, tutor SPM ${matchedCodename} dalam Bahasa Malaysia yang mesra pelajar.
Jana satu mesej alu-aluan yang MENARIK dan INFORMATIF untuk topik: "${topic.title}" (${topicId}).

Gunakan format markdown ini TEPAT-TEPAT:

## Selamat Datang ke ${topic.title}! ${emoji}

[1-2 ayat pengenalan menarik tentang kepentingan topik ini dalam SPM]

### 📚 Subtopik Utama
[senarai bullet point subtopik: ${subtopics}]

### ⚠️ Kesilapan Lazim Pelajar
[3 kesilapan lazim yang selalu pelajar buat dalam topik ini — specifik dan praktikal]

### 💡 Tips Peperiksaan SPM
[3 tip exam yang berguna dan spesifik untuk topik ini]

### 💡 Soalan Spot
${freqData ? `[Berdasarkan data exam past year di bawah, nyatakan konsep/subtopik PALING KERAP keluar — tulis sebagai "🔥 Kerap keluar: [konsep]" dan sertakan markah/bahagian]` : `[Nyatakan 2-3 subtopik/konsep yang PALING KERAP keluar dalam SPM berdasarkan syllabus KSSM ${matchedCodename}]`}

${examFreqSection}

Maklumat tambahan topik ini:
${kbSnippet}

PENTING: Tulis dalam Bahasa Malaysia. Padat, berguna, tidak terlalu panjang (max 400 patah perkataan). Gunakan emoji secara sederhana.`;

      const result = await retryGeminiCall(() => getAIClient().models.generateContent({
        model: MODEL_ANALYSER,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { temperature: 0.6, maxOutputTokens: 800 },
      } as any));

      const greeting = result?.text?.trim() || "";
      if (!greeting) return res.status(500).json({ error: "Gemini returned empty greeting" });

      // Persist to Firebase — 0 API cost for all future students
      await setDoc(doc(db, "topic_greetings", topicId), {
        greeting,
        topicId,
        topicTitle: topic.title,
        generatedAt: serverTimestamp(),
        hits: 0,
      });

      return res.json({ greeting, cached: false });
    } catch (err: any) {
      console.error("[topic-greeting] Error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  // Admin: force-refresh a topic greeting (delete + regenerate next GET)
  app.delete("/api/admin/topic-greeting/:topicId", async (req, res) => {
    try {
      await deleteDoc(doc(db, "topic_greetings", req.params.topicId));
      res.json({ deleted: true, topicId: req.params.topicId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: list all cached greetings
  app.get("/api/admin/topic-greetings", async (req, res) => {
    try {
      const snap = await getDocs(collection(db, "topic_greetings"));
      const list = snap.docs.map(d => ({
        topicId: d.id,
        topicTitle: d.data().topicTitle,
        hits: d.data().hits || 0,
        generatedAt: d.data().generatedAt?.toDate?.()?.toISOString() || null,
        preview: (d.data().greeting || "").slice(0, 100),
      }));
      res.json({ count: list.length, greetings: list });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: rebuild exam frequency index into Firestore
  app.post("/api/admin/rebuild-exam-frequency", async (req, res) => {
    try {
      const freqIndex = buildFrequencyIndex();
      const entries = Object.entries(freqIndex);
      
      for (const [topicId, data] of entries) {
        await setDoc(doc(db, "exam_frequency", topicId), {
          ...data,
          updatedAt: serverTimestamp(),
          paperCount: EXAM_PAPERS.length,
          papers: EXAM_PAPERS.map(p => ({ source: p.source, year: p.year, state: p.state })),
        });
      }

      // Also delete any cached topic_greetings so they get regenerated with new data
      if (req.body?.invalidateGreetings) {
        for (const topicId of Object.keys(freqIndex)) {
          await deleteDoc(doc(db, "topic_greetings", topicId)).catch(() => {});
        }
      }

      res.json({
        success: true,
        topicsUpdated: entries.length,
        topicIds: Object.keys(freqIndex),
        papersAnalysed: EXAM_PAPERS.length,
        invalidatedGreetings: !!req.body?.invalidateGreetings,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cikgu Kimia v2 server running on http://0.0.0.0:${PORT}`);
    console.log(`  models: chat=${MODEL_CHAT}, analyser=${MODEL_ANALYSER}, summary=${MODEL_SUMMARY}`);
  });
}

console.log("Initializing Cikgu Kimia v2 server...");
startServer().catch(err => {
  console.error("FATAL: Failed to start server:", err);
});
