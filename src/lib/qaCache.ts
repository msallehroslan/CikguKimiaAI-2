/**
 * Client-side Q&A cache using localStorage.
 * Caches answers to identical plain text questions to minimize API costs and improve response times.
 */

interface CacheEntry {
  question: string;
  answer: string;
  topicId?: string;
  timestamp: number;
}

const CACHE_KEY = "cikgu_kimia_qa_cache";

function normalizeString(str: any): string {
  if (typeof str !== "string") return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/[.,/#!$%\^&\*;:{}=\-_`~()?]/g, "") // remove punctuation
    .replace(/\s+/g, " "); // collapse spacing
}

export const qaCache = {
  getEntries(): CacheEntry[] {
    try {
      const data = localStorage.getItem(CACHE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse QA Cache from localStorage:", e);
      return [];
    }
  },

  setEntries(entries: CacheEntry[]) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn("localStorage space full or inaccessible:", e);
    }
  },

  hit(question: string, topicId?: string): string | null {
    const normQuestion = normalizeString(question);
    if (!normQuestion || normQuestion.length < 5) return null;

    const entries = this.getEntries();
    // Cache expiry: 1 day
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();

    const match = entries.find(entry => {
      const isSameTopic = entry.topicId === topicId;
      const isSameQuestion = normalizeString(entry.question) === normQuestion;
      const isNotExpired = (now - entry.timestamp) < ONE_DAY;
      return isSameTopic && isSameQuestion && isNotExpired;
    });

    return match ? match.answer : null;
  },

  set(question: string, answer: string, topicId?: string): void {
    const normQuestion = normalizeString(question);
    if (!normQuestion || !answer) return;

    const entries = this.getEntries();
    const now = Date.now();

    // Filter out duplicates and expired entries (keep only within 1 day)
    const filtered = entries.filter(entry => {
      const isSameQuestionAndTopic = normalizeString(entry.question) === normQuestion && entry.topicId === topicId;
      const isNotExpired = (now - entry.timestamp) < (24 * 60 * 60 * 1000);
      return !isSameQuestionAndTopic && isNotExpired;
    });

    const newEntry: CacheEntry = {
      question,
      answer,
      topicId,
      timestamp: now,
    };

    filtered.unshift(newEntry);

    // Keep cache size small: cap at 50 entries
    if (filtered.length > 50) {
      filtered.pop();
    }

    this.setEntries(filtered);
  }
};
