/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 3-Layer Q&A Cache System
 * Layer 1: localStorage (client-side, instant)
 * Layer 2: Firebase shared_cache (cross-user, persistent)
 * Layer 3: Gemini API (fallback, saves back to L1+L2)
 */

interface CacheEntry {
  question: string;
  answer: string;
  topicId?: string;
  timestamp: number;
  hitCount?: number;
}

const CACHE_KEY = "cikgu_kimia_qa_cache";
const MAX_ENTRIES = 200;
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

export function normalizeQuestion(str: any): string {
  if (typeof str !== "string") return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/[.,/#!$%\^&\*;:{}=\-_`~()?]/g, "")
    .replace(/\s+/g, " ");
}

export const qaCache = {
  // ─── Layer 1: localStorage ────────────────────────────────────────────────

  getEntries(): CacheEntry[] {
    try {
      const data = localStorage.getItem(CACHE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  setEntries(entries: CacheEntry[]) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
    } catch {
      // localStorage full — clear oldest half and retry
      try {
        const half = entries.slice(0, Math.floor(entries.length / 2));
        localStorage.setItem(CACHE_KEY, JSON.stringify(half));
      } catch { /* silently fail */ }
    }
  },

  hit(question: string, topicId?: string): string | null {
    const norm = normalizeQuestion(question);
    if (!norm || norm.length < 5) return null;

    const entries = this.getEntries();
    const now = Date.now();

    const idx = entries.findIndex(e =>
      normalizeQuestion(e.question) === norm &&
      e.topicId === topicId &&
      (now - e.timestamp) < CACHE_TTL
    );

    if (idx === -1) return null;

    // Bump hit count & move to front (LRU)
    const entry = { ...entries[idx], hitCount: (entries[idx].hitCount || 0) + 1 };
    entries.splice(idx, 1);
    entries.unshift(entry);
    this.setEntries(entries);

    return entry.answer;
  },

  set(question: string, answer: string, topicId?: string): void {
    const norm = normalizeQuestion(question);
    if (!norm || !answer) return;

    const entries = this.getEntries().filter(e => {
      const isDupe = normalizeQuestion(e.question) === norm && e.topicId === topicId;
      const isExpired = (Date.now() - e.timestamp) >= CACHE_TTL;
      return !isDupe && !isExpired;
    });

    entries.unshift({ question, answer, topicId, timestamp: Date.now(), hitCount: 0 });

    if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
    this.setEntries(entries);
  },

  getStats(): { total: number; topHits: CacheEntry[] } {
    const entries = this.getEntries();
    const topHits = [...entries]
      .sort((a, b) => (b.hitCount || 0) - (a.hitCount || 0))
      .slice(0, 5);
    return { total: entries.length, topHits };
  },

  clear(): void {
    localStorage.removeItem(CACHE_KEY);
  }
};
