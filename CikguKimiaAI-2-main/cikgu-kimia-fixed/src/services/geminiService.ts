/**
 * Cikgu Kimia — geminiService v2
 *
 * Now accepts the `history` argument straight from React state instead of
 * forcing the caller to re-fetch it from Firestore on every send.
 */

import { StudentMemory } from "./memoryService";

export interface Message {
  role: "user" | "model";
  text: string;
  images?: { mimeType: string; data: string }[];
  timestamp?: number;
}

export interface Asset {
  mimeType: string;
  data: string;
}

export class GeminiService {
  private memory: StudentMemory;

  constructor(memory: StudentMemory) {
    this.memory = memory;
  }

  /**
   * Stream a chat response. The caller passes `history` — last few in-memory
   * messages from React state — and we forward to the server unchanged.
   */
  async sendMessageStream(
    message: string,
    assets: Asset[] = [],
    onChunk: (text: string) => void,
    history: { role: string; parts: { text: string }[] }[] = [],
    selectedTopicId?: string
  ): Promise<void> {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          assets,
          memory: this.memory,
          history,
          selectedTopicId,
        }),
      });

      if (!response.ok) {
        // Try to read error details from body
        let serverError = "";
        try {
          if (response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              serverError += decoder.decode(value, { stream: true });
            }
          }
        } catch (e) {
          console.error("Error reading error body:", e);
        }

        if (serverError) {
          onChunk(serverError);
        } else {
          onChunk(`Maaf, Cikgu mengalami gangguan talian (HTTP ${response.status}). Sila cuba lagi. 🙏`);
        }
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        onChunk(decoder.decode(value, { stream: true }));
      }
    } catch (error: any) {
      console.error("Stream Error:", error);
      onChunk(`Maaf, Cikgu mengalami gangguan talian (${error?.message || "Ralat tidak diketahui"}). Boleh cuba lagi? 🙏`);
    }
  }

  async sendMessage(message: string, assets: Asset[] = []): Promise<string> {
    let fullText = "";
    await this.sendMessageStream(message, assets, (chunk) => {
      fullText += chunk;
    });
    return fullText;
  }

  async analyzeForMemory(conversation: string, images: Asset[] = []): Promise<any | null> {
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation, images }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error("Analyze Proxy Error:", error);
      return null;
    }
  }

  /**
   * Ask the server to summarise a long thread (sliding-window). Returns a short prose summary
   * that can replace the older half of the conversation history.
   */
  async summariseThread(messages: { role: string; text: string }[], topicId?: string): Promise<string> {
    try {
      const sanitizedMessages = (messages || []).map(m => ({
        role: m.role,
        text: typeof m.text === "string" ? m.text : ""
      }));
      const response = await fetch("/api/summarise-thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: sanitizedMessages, topicId }),
      });
      if (!response.ok) return "";
      const data = await response.json();
      return data.summary || "";
    } catch (error) {
      console.error("Summarise error:", error);
      return "";
    }
  }
}
