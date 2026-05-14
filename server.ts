import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { MARKING_SCHEME_TIPS } from "./src/constants/markingScheme.ts";
import { Telegraf } from "telegraf";

// We only need the type from memoryService
interface LocalStudentMemory {
  weakTopics: string[];
  lastExamScore?: string;
  identifiedMistakes: string[];
  examPapersAnalysis: string[];
}

// Helper for system instruction (ported from geminiService.ts)
const getSystemInstruction = (memory: any) => {
  let memoryContext = "";
  if (memory?.weakTopics?.length > 0) {
    memoryContext += `\n\nStudent's Weak Topics: ${memory.weakTopics.join(", ")}`;
  }
  if (memory?.examPapersAnalysis?.length > 0) {
    memoryContext += `\n\nNotes from past exam papers shared by student: \n${memory.examPapersAnalysis.join("\n")}`;
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

  return `You are "Cikgu Kimia", an expert KSSM SPM Chemistry tutor.
  
I HAVE PROCESSSED YOUR UPLOADED NOTES (T4 & T5 KSSM). I will use them as my primary "Brain".

Your Mission:
1. Ground every answer in the KSSM SPM syllabus.
2. Use friendly Malaysian Malay/English mix (DLP style).
3. Equations: Use LaTeX (e.g. $H_2O$).
4. Traps: Warn about common KSSM marking scheme pitfalls.
5. VISUAL AIDS (GAMBAR): When explaining concepts like electrolysis, titration, or atom structure, ALWAYS use SVG diagrams.
   Wrap the SVG code in a markdown block with language "svg".
   Example:
   \`\`\`svg
   <svg viewBox="0 0 100 100">...</svg>
   \`\`\`

KSSM SYLLABUS REFERENCE:
${syllabusContext}

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
6. DO NOT provide the answer immediately unless asked. Provide full "Skema Pemarkahan" after the student submits their attempt.`;
};

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
    
    bot.start((ctx) => {
      ctx.reply("Salam sejahtera! Saya Cikgu Kimia AI. Sila tanya apa-apa soalan berkaitan Kimia SPM (KSSM). 🧪");
    });

    bot.on("text", async (ctx) => {
      const userMessage = ctx.message.text;
      
      try {
        // Send typing indicator
        await ctx.sendChatAction("typing");

        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: userMessage,
          config: {
            systemInstruction: getSystemInstruction({}), // Global context for TG bot
            temperature: 0.7,
          }
        });

        const responseText = response.text || "Maaf, Cikgu tidak dapat memproses soalan itu.";
        // Simple markdown sanitization for TG (it doesn't support complex SVG/math as well as web, but we'll try)
        await ctx.reply(responseText.replace(/```svg[\s\S]*?```/g, "[Gambar Rajah - Sila rujuk aplikasi web untuk paparan penuh]"));
      } catch (error) {
        console.error("TG Bot Error:", error);
        await ctx.reply("Maaf, Cikgu mengalami sedikit gangguan teknikal. Cuba lagi nanti.");
      }
    });

    // Handle webhook
    app.post("/api/telegram-webhook", (req, res) => {
      bot?.handleUpdate(req.body, res);
    });

    // Set webhook if APP_URL is available
    const appUrl = process.env.APP_URL;
    if (appUrl) {
      const webhookUrl = `${appUrl}/api/telegram-webhook`;
      bot.telegram.setWebhook(webhookUrl).then(() => {
        console.log(`Telegram Bot Webhook set to: ${webhookUrl}`);
      }).catch(err => {
        console.error("Failed to set TG Webhook:", err);
      });
    } else {
      console.log("APP_URL not set, Telegram Bot will need manual webhook setup or polling.");
      // Fallback to polling ONLY in local dev if you want, but Webhook is better for Cloud Run
      if (process.env.NODE_ENV !== "production") {
        bot.launch().then(() => console.log("TG Bot started via Polling (Dev Mode)"));
      }
    }
  } else {
    console.log("TELEGRAM_BOT_TOKEN not found. Telegram integration disabled.");
  }

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      gemini: !!process.env.GEMINI_API_KEY,
      telegram: !!process.env.TELEGRAM_BOT_TOKEN,
      timestamp: new Date().toISOString()
    });
  });

  // API Route for streaming chat
  app.post("/api/chat", async (req, res) => {
    const { message, assets, memory } = req.body;
    
    try {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      const chat = ai.chats.create({
        model: "gemini-1.5-flash",
        config: {
          systemInstruction: getSystemInstruction(memory),
          temperature: 0.7,
        },
      });

      const parts: any[] = [{ text: message || "Explain this image related to SPM Chemistry." }];
      if (assets && assets.length > 0) {
        assets.forEach((asset: any) => {
          parts.push({
            inlineData: {
              mimeType: asset.mimeType,
              data: asset.data
            }
          });
        });
      }

      const result = await chat.sendMessageStream({ message: parts });
      
      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          res.write(text);
        }
      }
      res.end();
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).write("Maaf, Cikgu mengalami gangguan teknikal. Sila cuba lagi sebentar.");
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
        parts.push({ text: "Analyze this chemistry note/exam paper/work. Extract key definitions, concepts, or mistakes. Identify which KSSM syllabus topic it relates to. Respond with a concise bulleted list of 2-3 essential 'Brain' insights to remember for this student. Respond with 'NONE' if no value is found." });
      } else {
        parts.push({ text: `Based on this conversation, update the student memory with weaknesses or insights.\n\nConversation:\n${conversation}` });
      }

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: { parts }
      });
      
      const text = (response.text || "").trim();
      res.json({ analysis: text === "NONE" ? null : text });
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
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

console.log("Initializing startServer...");
startServer().catch(err => {
  console.error("FATAL: Failed to start server:", err);
});
