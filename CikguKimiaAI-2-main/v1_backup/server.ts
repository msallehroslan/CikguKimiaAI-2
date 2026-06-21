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

const WEB_APP_URL = process.env.APP_URL || "https://ais-pre-plschybuw4bxx5jgbdpsgu-244423792092.asia-southeast1.run.app";
const menuKeyboard = Markup.inlineKeyboard([
  Markup.button.url("Buka Cikgu Kimia App", WEB_APP_URL),
]);

// We only need the type from memoryService
interface LocalStudentMemory {
  weakTopics: string[];
  lastExamScore?: string;
  identifiedMistakes: string[];
  examPapersAnalysis: string[];
}

// Helper to implement retry logic for Gemini API calls
async function retryGeminiCall<T>(call: () => Promise<T>, retries = 5, backoff = 2000): Promise<T> {
  try {
    return await call();
  } catch (error: any) {
    if ((error?.status === 503 || error?.status === 429) && retries > 0) {
      console.warn(`Gemini ${error?.status || '503/429'} error, retrying in ${backoff}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return retryGeminiCall(call, retries - 1, backoff * 2);
    }
    throw error;
  }
}

// Helper for system instruction (ported from geminiService.ts)
const getSystemInstruction = (memory: any, platform: "web" | "telegram" = "web", selectedTopicId?: string, userMessage?: string) => {
  let memoryContext = "";
  if (memory?.weakTopics?.length > 0) {
    memoryContext += `\n\nStudent's Weak Topics: ${memory.weakTopics.join(", ")}`;
  }
  if (memory?.examPapersAnalysis?.length > 0) {
    memoryContext += `\n\nNotes from past exam papers shared by student: \n${memory.examPapersAnalysis.join("\n")}`;
  }

  // RAG Context from internal knowledge base
  let ragContext = "";
  let detectedTopicId = selectedTopicId;

  // 1. Agentic Detection: Check if user's current message points to a DIFFERENT topic
  if (userMessage) {
    const query = userMessage.toLowerCase();
    const strongestMatch = SYLLABUS_KNOWLEDGE_BASE.find(t => 
      query.includes(t.title.toLowerCase()) || 
      t.keyPoints.some(k => query.includes(k.toLowerCase()) && k.length > 5)
    );
    if (strongestMatch && strongestMatch.topicId !== selectedTopicId) {
      detectedTopicId = strongestMatch.topicId;
      ragContext = `\n\n[CONTEXT SHIFT DETECTED]: Student is now asking about ${strongestMatch.title}.\nOFFICIAL SYLLABUS REFERENCE:\n${strongestMatch.context}\nKey Facts:\n- ${strongestMatch.keyPoints.join("\n- ")}`;
    }
  }

  // 2. Precise retrieval via detected/selected topic
  if (!ragContext && detectedTopicId) {
    const topicData = SYLLABUS_KNOWLEDGE_BASE.find(t => t.topicId === detectedTopicId);
    if (topicData) {
      ragContext = `\n\nOFFICIAL SYLLABUS REFERENCE FOR ${topicData.title}:\n${topicData.context}\nKey Facts:\n- ${topicData.keyPoints.join("\n- ")}`;
    }
  } 
  
  // 3. Fallback Agentic Retrieval via broad keyword search
  if (userMessage && !ragContext) {
    const query = userMessage.toLowerCase();
    const matches = SYLLABUS_KNOWLEDGE_BASE.filter(t => 
      t.title.toLowerCase().includes(query) || 
      t.keyPoints.some(k => k.toLowerCase().includes(query))
    );
    
    if (matches.length > 0) {
      ragContext = matches.map(m => `\n\nRELEVANT CHAPTER: ${m.title}\n${m.context}\nFacts:\n- ${m.keyPoints.join("\n- ")}`).join("\n");
    }
  }

  if (!ragContext) {
    ragContext = `\n\nGENERAL KNOWLEDGE BASE OVERVIEW:\n${SYLLABUS_KNOWLEDGE_BASE.slice(0, 3).map(t => `- ${t.title}: ${t.context}`).join("\n")}`;
  }

  const syllabusContext = `
  Silabus KSSM Tingkatan 4:
  - Bab 1: Pengenalan kpd Kimia
  - Bab 2: Jirim & Struktur Atom
  - Bab 3: Konsep Mol, Formula & Persamaan Kimia
  - Bab 4: Jadual Berkala Unsur
  - Bab 5: Ikatan Kimia
  - Bab 6: Asid, Bes & Garam
  - Bab 7: Kadar Tindak Balas
  - Bab 8: Bahan Buatan dlm Industri
  
  Silabus KSSM Tingkatan 5:
  - Bab 1: Keseimbangan Redoks
  - Bab 2: Sebatian Karbon
  - Bab 3: Termokimia
  - Bab 4: Polimer
  - Bab 5: Kimia Konsumer & Industri`;

  const globalInsights = [
    "Nationwide, students often forget to mention 'frequency of EFFECTIVE collision' in Rate of Reaction.",
    "Thermochemistry answers MUST include signs (+/-) and units (kJ mol-1).",
    "In Redox, AN OX and RED CAT rule is essential.",
    "For Salt preparation, prioritize Soluble and Insoluble salt rules."
  ];

  const markingTipsContext = (MARKING_SCHEME_TIPS || []).map(tip => (
    `Topic: ${tip.topic}\nKeywords: ${tip.requiredKeywords.join(", ")}\nLogic: ${tip.markingSchemeLogic}`
  )).join("\n\n");

  let baseInstruction = `You are "CIKGU AI NEXUS", an expert KSSM SPM Chemistry tutor.
  
I HAVE PROCESSSED YOUR UPLOADED NOTES (T4 & T5 KSSM). I will use them as my primary "Brain".

Your Mission:
1. LANGUAGE ADHERENCE (CRITICAL): You MUST respond in the EXACT SAME language used by the user. 
   - If the user writes in English, your entire response MUST be in English.
   - If the user writes in Malay, your entire response MUST be in Malay.
   - Mixing languages (DLP style) is ONLY permitted if the user themselves mixes languages in their message.
   - This is the most important rule. Breaking it confuses the student.
2. Ground every answer in the KSSM SPM syllabus.
3. Equations: Use LaTeX symbols (e.g. $H_2O$, $H^+$, $SO_4^{2-}$).
4. Traps: Warn about common KSSM marking scheme pitfalls.
5. VISUAL AIDS (GAMBAR): When explaining concepts like electrolysis, titration, or atom structure, ALWAYS use SVG diagrams.
   Wrap the SVG code in a markdown block with language "svg".
   Example:
   \`\`\`svg
   <svg viewBox="0 0 100 100">...</svg>
   \`\`\`

KSSM SYLLABUS REFERENCE:
${syllabusContext}

INTERNAL KNOWLEDGE BASE (RAG):
${ragContext}

COLLECTIVE SPM INSIGHTS:
${globalInsights.join("\n")}

STUDENT-SPECIFIC CONTEXT (MEMORY):
${memoryContext}

SPM MARKING SCHEME GUIDELINES:
${markingTipsContext}

EXAM MODE (PAPER 2 - STRUCTURED & ESSAY):
When the user asks for "Kertas 2" or "Exam Mode":
1. Generate a realistic SPM Paper 2 question (Section A for Structured, Section B/C for Essay).
2. Include marks allocation for each sub-question, e.g., (2 m) or [3 markah].
3. Use standard SPM command words: Nyatakan, Terangkan, Lukis susunan radas, Hitungkan, Bandingkan.
4. For Structured questions (Section A), provide 3-4 sub-questions (a, b, c, d).
5. For Essay questions (Section B/C), provide a scenario/stimulus followed by a descriptive question.
6. AGENTIC LEARNING:
- You are a neural learning agent. 
- You discover "patterns" in student mistakes.
- If you find a very common pitfall (e.g., student keeps confusing Mole with Mass), highlight it with [NEURAL_INSIGHT].
- This insight will be shared globally to help other students master SPM.`;

  if (platform === "telegram") {
    baseInstruction += `
    
TELEGRAM BOT INSTRUCTIONS:
- You are communicating via Telegram. SVG diagrams will be hidden and replaced with a link to the web app.
- Since the user won't see the SVG in Telegram, please provide a brief but clear text-based visual description or a simple ASCII/emoji-based visualization if it helps explain the concept.
- USE STANDARD MARKDOWN: **Bold**, *Italic*. 
- DO NOT use HTML tags (<b>, <i>, etc.) directly in your response.
- For subscripts and superscripts in Chemistry formulas, use notation like $H_2O$ or $SO_4^{2-}$.
- ALWAYS respond in the student's language. If they say "Hi", use English. If they use Malay words like "cikgu", feel free to respond in Malay or mixed (DLP style) if it feels natural. 🇲🇾🇨🇳🇮🇳
- Make your responses punchy and structured with bullet points. Use emojis relevant to Chemistry (🧪, ⚗️, ⚛️, 🔋).`;
  }

  return baseInstruction;
};

// Helper to format text for Telegram (HTML)
function formatForTelegram(text: string): string {
  // 1. Handle SVGs first - replace with a friendly placeholder
  let formatted = text.replace(/```svg\s*[\s\S]*?\s*```/g, () => {
    return "\n\n[📊 <b>Rajah Kimia</b>: Sila tekan butang di bawah untuk lihat rajah penuh dlm web app]\n\n";
  });

  // 2. Escape HTML special characters for Telegram HTML mode
  // REQUIRED: We must escape these before adding our own tags (<b>, <i>, etc.)
  // This prevents user-generated content from breaking the HTML formatting
  formatted = formatted.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // 3. Convert Markdown to Telegram-compatible HTML
  // Lists
  formatted = formatted.replace(/^\s*[\-\*] (.*$)/gm, '• $1');
  formatted = formatted.replace(/^\s*\d+\. (.*$)/gm, '$1');

  // Headers (### Header -> <b>Header</b>)
  formatted = formatted.replace(/^#{1,4} (.*$)/gm, '<b>$1</b>');

  // Bold (**text** or __text__)
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  formatted = formatted.replace(/__(.*?)__/g, '<b>$1</b>');
  
  // Italic (*text* or _text_)
  // Use a safer regex that avoids internal characters
  formatted = formatted.replace(/(^|\s)\*(?!\s)(.*?)(?<!\s)\*($|\s)/g, '$1<i>$2</i>$3');
  formatted = formatted.replace(/(^|\s)_(?!\s)(.*?)(?<!\s)_($|\s)/g, '$1<i>$2</i>$3');

  // 4. Handle Chemistry LaTeX-style formulas (Convert to HTML sub/sup)
  // Subscripts: H_2O, H_{2}O, $H_2O$
  formatted = formatted.replace(/\$?([A-Z][a-z]?)_\{?(\d+)\}?\$?/g, '$1<sub>$2</sub>');
  
  // Superscripts: H^+, H^{2+}, $H^+$
  formatted = formatted.replace(/\$?([A-Z][a-z]?)\^\{?([\+\-0-9a-z\(\)]+)\}?\$?/g, '$1<sup>$2</sup>');
  
  // Combined Sub/Sup: SO_4^{2-} or $SO_4^{2-}$
  formatted = formatted.replace(/\$?([A-Z][a-z]?)_\{?(\d+)\}?\^\{?([\+\-0-9a-z]+)\}?\$?/g, '$1<sub>$2</sub><sup>$3</sup>');

  // Cleanup remaining math delimiters
  formatted = formatted.replace(/\$/g, '');

  // 5. Common Chemistry Symbols
  formatted = formatted.replace(/\\rightarrow/g, '→');
  formatted = formatted.replace(/\\leftarrow/g, '←');
  formatted = formatted.replace(/\\Delta/g, 'Δ');
  formatted = formatted.replace(/\\times/g, '×');
  formatted = formatted.replace(/\\degree/g, '°');
  formatted = formatted.replace(/---/g, '────────────────');

  return formatted.trim();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY is not set in environment variables!");
  }
  
  const ai = new GoogleGenAI({ 
    apiKey: apiKey || "MISSING_KEY",
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  // Telegram Bot Setup
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  let bot: Telegraf | null = null;

  if (botToken) {
    bot = new Telegraf(botToken);
    
    bot.start(async (ctx) => {
      console.log("TG Bot received /start from", ctx.message.from.id);
      try {
        const welcome = "<b>Salam Sejahtera!</b>\n\nSelamat datang ke <b>CIKGU AI NEXUS</b> 🧪\n\nTutor Kimia AI peribadi anda untuk SPM. Saya sedia membantu anda menguasai <i>Redox</i>, <i>Bes & Garam</i>, <i>Sebatian Karbon</i> dan banyak lagi.\n\nSila tanya apa-apa soalan atau <b>hantar gambar</b> soalan peperiksaan anda! 📸";
        await ctx.reply(welcome, { parse_mode: 'HTML', ...menuKeyboard });
      } catch (err) {
        console.error("TG Bot failed to reply to /start", err);
      }
    });

    bot.command("menu", async (ctx) => {
      try {
        await ctx.reply("🧪 <b>Menu Cikgu Kimia Nexus:</b>", { parse_mode: 'HTML', ...menuKeyboard });
      } catch (err) {
        console.error("TG Bot failed to reply to /menu", err);
      }
    });

    bot.on("photo", async (ctx) => {
      const photo = ctx.message.photo.pop();
      if (!photo) return;
      
      const fileLink = await ctx.telegram.getFileLink(photo.file_id);
      const userMessage = ctx.message.caption || "Analyze this chemistry problem.";
      
      console.log(`TG User (${ctx.from.id}) sent photo: ${fileLink}`);
      
      try {
        await ctx.sendChatAction("typing");
        
        const response = await fetch(fileLink.toString());
        const buffer = await response.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString('base64');

        const result = await retryGeminiCall(() => ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ 
            role: "user", 
            parts: [
              { inlineData: { mimeType: "image/jpeg", data: base64Data } },
              { text: userMessage }
            ] 
          }],
          config: {
            systemInstruction: getSystemInstruction({}, "telegram", undefined, userMessage),
            temperature: 0.7,
          }
        } as any));

        const responseText = result.text || "Maaf, Cikgu tidak dapat memproses gambar itu.";
        const formattedResponse = formatForTelegram(responseText);
        
        await ctx.reply(formattedResponse, {
          parse_mode: 'HTML',
          ...menuKeyboard
        });
      } catch (error) {
        console.error("TG Photo Error:", error);
        await ctx.reply("Maaf, Cikgu gagal memproses gambar anda. Sila cuba lagi.");
      }
    });

    bot.on("text", async (ctx) => {
      const userMessage = ctx.message.text;
      console.log(`TG User (${ctx.from.id}): ${userMessage}`);
      
      try {
        await ctx.sendChatAction("typing");

        const response = await retryGeminiCall(() => ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          config: {
            systemInstruction: getSystemInstruction({}, "telegram", undefined, userMessage),
            temperature: 0.7,
          }
        } as any));

        const responseText = response.text || "Maaf, Cikgu tidak dapat memproses soalan itu.";
        const formattedResponse = formatForTelegram(responseText);
        
        try {
          await ctx.reply(formattedResponse, {
            parse_mode: 'HTML',
            ...menuKeyboard
          });
        } catch (htmlError) {
          console.error("TG HTML Error, retrying with raw text:", htmlError);
          const rawText = responseText.replace(/```svg\s*[\s\S]*?\s*```/g, "\n[Rajah tersedia di Web App]\n");
          await ctx.reply(rawText, menuKeyboard);
        }
      } catch (error) {
        console.error("TG Bot Error:", error);
        await ctx.reply("Maaf, Cikgu mengalami sedikit gangguan teknikal. Cuba lagi nanti.");
      }
    });

    // Handle webhook
    app.post("/api/telegram-webhook", (req, res) => {
      bot?.handleUpdate(req.body, res).catch(err => {
        console.error("Webhook handle error:", err);
      });
    });

    // Set webhook
    const appUrl = process.env.APP_URL;
    if (appUrl) {
      const webhookUrl = `${appUrl}/api/telegram-webhook`;
      bot.telegram.setWebhook(webhookUrl).then(() => {
        console.log(`TG Webhook set: ${webhookUrl}`);
      }).catch(err => console.error("TG Webhook fail:", err));
    } else if (process.env.NODE_ENV !== "production") {
      bot.launch().then(() => console.log("TG Bot polling (Dev)"));
    }
  }

  // API Route for health check
  app.get("/api/health", async (req, res) => {
    let botInfo = null;
    if (bot) {
      try {
        botInfo = await bot.telegram.getMe();
      } catch (e) {}
    }
    res.json({
      status: "ok",
      gemini: !!process.env.GEMINI_API_KEY,
      telegram: !!botInfo,
      botName: botInfo?.username || null
    });
  });

  // API Route for collective learning discovery
  app.post("/api/discovery", async (req, res) => {
    const { topic, insight } = req.body;
    try {
      await addDoc(collection(db, "global_insights"), {
        topic,
        insight,
        createdAt: serverTimestamp(),
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Discovery error:", error);
      res.status(500).json({ error: "Failed to store discovery" });
    }
  });

  // API Route for streaming chat
  app.post("/api/chat", async (req, res) => {
    const { message, assets, memory, history, selectedTopicId, userId } = req.body;
    
    try {
      // Basic Usage Guard (Neural Energy System)
      if (userId) {
         // In a production scaling environment, we'd use Firestore or Redis to track this.
         // For now, we will assume the client tracks its local state, 
         // and we could add a secondary check here if needed.
         console.log(`[Neural Engine] Processing request for User: ${userId}`);
      }

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');

      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        history: history || [],
        config: {
          systemInstruction: getSystemInstruction(memory, "web", selectedTopicId, message),
          temperature: 0.7,
        },
      } as any);

      console.log('Sending message to chat session...');
      console.log('Message content:', JSON.stringify(message));
      console.log('Assets count:', assets?.length || 0);

      const parts: any[] = [];
      if (assets && assets.length > 0) {
        assets.forEach((asset: any) => {
          console.log('--- Asset Debug ---');
          console.log('mimeType:', asset.mimeType);
          console.log('data available:', !!asset.data);
          console.log('data length:', asset.data?.length);
          if (asset.data) {
              console.log('data starts with:', asset.data.substring(0, 50));
          }
          parts.push({
            inlineData: {
              mimeType: asset.mimeType,
              data: asset.data
            }
          });
        });
      }
      parts.push({ text: message || "Explain this image related to SPM Chemistry." });
      
      console.log('Parts array:', JSON.stringify(parts, null, 2));

      // The SDK expects { message: ... } where message content matches the expected union.
      const result = await retryGeminiCall(() => chat.sendMessageStream({ message: parts }));
      
      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          res.write(text);
        }
      }
      res.end();
    } catch (error) {
      console.error("Gemini Error:", error);
      if (!res.headersSent) {
        res.status(500);
      }
      res.write("Maaf, Cikgu mengalami gangguan teknikal. Sila cuba lagi sebentar.");
      res.end();
    }
  });

  // API Route for analysis/memory
  app.post("/api/analyze", async (req, res) => {
    const { conversation, images } = req.body;
    try {
      const parts = [];
      if (images && images.length > 0) {
        images.forEach((img: any) => {
          parts.push({
            inlineData: {
              mimeType: img.mimeType,
              data: img.data
            }
          });
        });
        parts.push({ text: "Analyze this SPM Chemistry content. Extract potential memory updates in JSON format:\n{\n  \"weakTopics\": [\"topic1\", ...],\n  \"identifiedMistakes\": [\"mistake1\", ...],\n  \"examPapersAnalysis\": [\"summary1\", ...]\n}\n\nIdentify if student has weaknesses in specific topics or made conceptual mistakes. If it's an exam paper, provide a summary. Return ONLY the JSON object. If nothing relevant, return {}." });
      } else {
        parts.push({ text: `Analyze this conversation for student memory updates. Extract potential weaknesses or mistakes in JSON format:\n{\n  \"weakTopics\": [],\n  \"identifiedMistakes\": []\n}\n\nConversation:\n${conversation}\n\nReturn ONLY the JSON object. If nothing relevant, return {}.` });
      }

      const response = await retryGeminiCall(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts }
      }));
      
      let text = (response.text || "").trim();
      // Remove possible markdown formatting
      text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      
      try {
        const analysis = JSON.parse(text);
        res.json({ analysis });
      } catch (e) {
        console.error("JSON Parse Error in Analyze:", text);
        res.json({ analysis: {} });
      }
    } catch (error) {
      console.error("Analyze Error:", error);
      res.status(500).json({ error: "Failed to analyze" });
    }
  });

  // Vite middle-ware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Explicit SPA fallback for dev mode
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  console.log("Starting server on port", PORT);
  // Bootstrap global insights if empty
  const seedInsights = async () => {
    const q = query(collection(db, "global_insights"), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
      const initial = [
        { topic: "Redox", insight: "Banyak pelajar keliru antara Agen Pengoksidaan (bahan diturunkan) vs Proses Pengoksidaan." },
        { topic: "Garam", insight: "Gunakan akronim 'PAN' (Pb, Ag, Hg) untuk ingat garam klorida tak larut." },
        { topic: "Kadar Tindak Balas", insight: "Faktor saiz hanya terpakai kepada bahan pepejal sahaja." }
      ];
      for (const item of initial) {
        await addDoc(collection(db, "global_insights"), { ...item, createdAt: serverTimestamp() });
      }
    }
  };
  seedInsights().catch(console.error);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

console.log("Initializing startServer...");
startServer().catch(err => {
  console.error("FATAL: Failed to start server:", err);
});
