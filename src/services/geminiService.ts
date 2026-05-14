import { StudentMemory } from "./memoryService";

export interface Message {
  role: "user" | "model";
  text: string;
  images?: { mimeType: string; data: string }[];
}

export class GeminiService {
  private memory: StudentMemory;

  constructor(memory: StudentMemory) {
    this.memory = memory;
  }

  async sendMessageStream(message: string, assets: { mimeType: string; data: string }[] = [], onChunk: (text: string) => void): Promise<void> {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message, 
          assets, 
          memory: this.memory 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to teacher. Please try again.");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
      }
    } catch (error) {
      console.error("Stream Error:", error);
      onChunk("Maaf, Cikgu mengalami sedikit gangguan talian. Boleh cuba lagi? 🙏");
    }
  }

  async sendMessage(message: string, assets: { mimeType: string; data: string }[] = []): Promise<string> {
    // Standard fetch if streaming is not needed, but we prefer streaming for chat
    let fullText = "";
    await this.sendMessageStream(message, assets, (chunk) => {
      fullText += chunk;
    });
    return fullText;
  }

  async analyzeForMemory(conversation: string, images: { mimeType: string; data: string }[] = []): Promise<string | null> {
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
}

