import { describe, it, expect, beforeEach, vi } from "vitest";
import { qaCache } from "../qaCache";

// ─── helpers ─────────────────────────────────────────────────────────────────

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function seedCache(
  entries: Array<{
    question: string;
    answer: string;
    topicId?: string;
    timestamp: number;
  }>
) {
  localStorage.setItem("cikgu_kimia_qa_cache", JSON.stringify(entries));
}

// ─── normalizeString (tested via hit/set behaviour) ──────────────────────────

describe("qaCache normalisation", () => {
  it("matches questions that differ only in case", () => {
    qaCache.set("Apa itu asid?", "Asid ialah...", "acids");
    expect(qaCache.hit("APA ITU ASID?", "acids")).not.toBeNull();
  });

  it("matches questions that differ only in punctuation", () => {
    qaCache.set("What is an acid?", "An acid is...", "acids");
    expect(qaCache.hit("What is an acid", "acids")).not.toBeNull();
  });

  it("matches questions with extra whitespace", () => {
    qaCache.set("define  acid", "An acid is...", "acids");
    expect(qaCache.hit("define acid", "acids")).not.toBeNull();
  });

  it("returns null for questions shorter than 5 normalised characters", () => {
    qaCache.set("hi", "Hey!", "general");
    expect(qaCache.hit("hi", "general")).toBeNull();
  });

  it("returns null for non-string input", () => {
    // @ts-expect-error — deliberate wrong type
    expect(qaCache.hit(null, "acids")).toBeNull();
    // @ts-expect-error
    expect(qaCache.hit(42, "acids")).toBeNull();
  });
});

// ─── hit — topic isolation ────────────────────────────────────────────────────

describe("qaCache.hit topic isolation", () => {
  it("returns null when the question matches but the topic differs", () => {
    qaCache.set("What is oxidation?", "Loss of electrons", "redox");
    expect(qaCache.hit("What is oxidation?", "acids")).toBeNull();
  });

  it("returns null when both topic and question are undefined but stored entry has a topic", () => {
    qaCache.set("What is oxidation?", "Loss of electrons", "redox");
    expect(qaCache.hit("What is oxidation?", undefined)).toBeNull();
  });

  it("returns a hit when both question and topic match exactly", () => {
    qaCache.set("What is oxidation?", "Loss of electrons", "redox");
    expect(qaCache.hit("What is oxidation?", "redox")).toBe(
      "Loss of electrons"
    );
  });
});

// ─── hit — TTL expiry ─────────────────────────────────────────────────────────

describe("qaCache.hit TTL expiry", () => {
  it("returns null for an entry older than 1 day", () => {
    const oldTimestamp = Date.now() - ONE_DAY_MS - 1;
    seedCache([
      {
        question: "Apa itu ion?",
        answer: "Atom bercas",
        topicId: "ions",
        timestamp: oldTimestamp,
      },
    ]);
    expect(qaCache.hit("Apa itu ion?", "ions")).toBeNull();
  });

  it("returns the answer for an entry within the 1 day TTL", () => {
    const recentTimestamp = Date.now() - ONE_DAY_MS + 60_000;
    seedCache([
      {
        question: "Apa itu ion?",
        answer: "Atom bercas",
        topicId: "ions",
        timestamp: recentTimestamp,
      },
    ]);
    expect(qaCache.hit("Apa itu ion?", "ions")).toBe("Atom bercas");
  });
});

// ─── set — deduplication ──────────────────────────────────────────────────────

describe("qaCache.set deduplication", () => {
  it("does not add a second entry for the same question + topic", () => {
    qaCache.set("Apa itu asid?", "Asid ialah zat pH < 7", "acids");
    qaCache.set("Apa itu asid?", "Updated answer", "acids");
    const entries = qaCache.getEntries();
    const matching = entries.filter(
      (e) => e.topicId === "acids"
    );
    expect(matching).toHaveLength(1);
  });

  it("updates the answer when the same question is re-cached", () => {
    qaCache.set("Apa itu asid?", "First answer", "acids");
    qaCache.set("Apa itu asid?", "Better answer", "acids");
    expect(qaCache.hit("Apa itu asid?", "acids")).toBe("Better answer");
  });

  it("allows the same question for different topics", () => {
    qaCache.set("What is a bond?", "Answer A", "topic-a");
    qaCache.set("What is a bond?", "Answer B", "topic-b");
    expect(qaCache.hit("What is a bond?", "topic-a")).toBe("Answer A");
    expect(qaCache.hit("What is a bond?", "topic-b")).toBe("Answer B");
  });

  it("does nothing when answer is empty string", () => {
    qaCache.set("Apa itu asid?", "", "acids");
    expect(qaCache.hit("Apa itu asid?", "acids")).toBeNull();
  });
});

// ─── set — capacity cap ──────────────────────────────────────────────────────

describe("qaCache capacity cap", () => {
  it("keeps at most 50 entries, discarding the oldest when over capacity", () => {
    // Pre-fill with 50 distinct entries
    const initial = Array.from({ length: 50 }, (_, i) => ({
      question: `Question ${i}`,
      answer: `Answer ${i}`,
      topicId: "test",
      timestamp: Date.now() - (50 - i) * 1000, // oldest first
    }));
    seedCache(initial);

    // Adding a 51st entry should evict the last (oldest) entry
    qaCache.set("Brand new question", "Brand new answer", "test");
    const entries = qaCache.getEntries();
    expect(entries).toHaveLength(50);
    // The new entry should be at the front
    expect(entries[0].question).toBe("Brand new question");
  });

  it("evicts expired entries regardless of capacity", () => {
    const old = Array.from({ length: 5 }, (_, i) => ({
      question: `Old question ${i}`,
      answer: `Old answer ${i}`,
      topicId: "stale",
      timestamp: Date.now() - ONE_DAY_MS - 1000, // all expired
    }));
    seedCache(old);

    qaCache.set("Fresh question", "Fresh answer", "stale");
    const entries = qaCache.getEntries();
    // Only the fresh entry should remain
    expect(entries).toHaveLength(1);
    expect(entries[0].question).toBe("Fresh question");
  });
});

// ─── getEntries — resilience ──────────────────────────────────────────────────

describe("qaCache.getEntries resilience", () => {
  it("returns empty array when localStorage is empty", () => {
    expect(qaCache.getEntries()).toEqual([]);
  });

  it("returns empty array when localStorage contains corrupt JSON", () => {
    localStorage.setItem("cikgu_kimia_qa_cache", "not-valid-json{{");
    expect(qaCache.getEntries()).toEqual([]);
  });

  it("returns empty array when localStorage value is not an array", () => {
    localStorage.setItem(
      "cikgu_kimia_qa_cache",
      JSON.stringify({ notAnArray: true })
    );
    expect(qaCache.getEntries()).toEqual([]);
  });
});
