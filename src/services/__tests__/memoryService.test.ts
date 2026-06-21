import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Firebase mocks must be set up before importing the module ────────────────

const mockBatchSet = vi.fn();
const mockBatchCommit = vi.fn(() => Promise.resolve());
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn(() => Promise.resolve());

vi.mock("../../lib/firebase", () => ({
  db: {},
  auth: {
    get currentUser() {
      return mockCurrentUser;
    },
  },
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db: unknown, path: string, ...segments: string[]) =>
    ({ path: [path, ...segments].join("/") })
  ),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  writeBatch: vi.fn(() => ({
    set: mockBatchSet,
    commit: mockBatchCommit,
  })),
  serverTimestamp: vi.fn(() => "server-ts"),
  increment: vi.fn((n: number) => ({ _increment: n })),
  collection: vi.fn((_db: unknown, path: string) => ({ path })),
  addDoc: vi.fn(),
}));

// Mutable current user — tests override this
let mockCurrentUser: { email: string | null; uid?: string } | null = {
  email: "student@test.com",
  uid: "user-abc",
};

import {
  isAdmin,
  memoryService,
  DAILY_CAP,
  DAILY_CAP_PREMIUM,
  type StudentMemory,
} from "../memoryService";

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeSnap(data: Partial<StudentMemory> | null) {
  return {
    exists: () => data !== null,
    data: () => data ?? {},
  };
}

const FAR_FUTURE = Date.now() + 24 * 60 * 60 * 1000;

/** Default memory that satisfies all v2 fields */
function baseMem(overrides: Partial<StudentMemory> = {}): StudentMemory {
  return {
    weakTopics: [],
    identifiedMistakes: [],
    examPapersAnalysis: [],
    dailyMessages: 0,
    dailyResetAt: FAR_FUTURE,
    currentStreak: 3,
    longestStreak: 5,
    lastActiveDay: "2024-01-15",
    mastery: {},
    ...overrides,
  };
}

// ─── isAdmin ─────────────────────────────────────────────────────────────────

describe("isAdmin", () => {
  it("returns true for known admin emails", () => {
    expect(isAdmin("msallehroslan@gmail.com")).toBe(true);
    expect(isAdmin("salleh@ioteratechnologies.com")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isAdmin("MSALLEHROSLAN@GMAIL.COM")).toBe(true);
    expect(isAdmin("Salleh@IoteRATechnologies.com")).toBe(true);
  });

  it("returns false for non-admin emails", () => {
    expect(isAdmin("student@school.com")).toBe(false);
    expect(isAdmin("admin@evil.com")).toBe(false);
  });

  it("returns false for null / undefined / empty string", () => {
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
    expect(isAdmin("")).toBe(false);
  });

  it("does not match emails with surrounding whitespace", () => {
    // Implementation uses ADMIN_EMAILS.includes() which is an exact match after
    // lowercasing — leading/trailing whitespace must not grant admin access.
    expect(isAdmin(" msallehroslan@gmail.com")).toBe(false);
    expect(isAdmin("msallehroslan@gmail.com ")).toBe(false);
  });
});

// ─── getNextResetAt ───────────────────────────────────────────────────────────

describe("memoryService.getNextResetAt", () => {
  it("returns the same day's 5am MYT when called before 5am MYT", () => {
    // 4:00 MYT on 2024-01-15  →  2024-01-14 20:00 UTC
    const before5am = new Date("2024-01-14T20:00:00.000Z").getTime();
    // Expected reset: 2024-01-15 05:00 MYT = 2024-01-14 21:00 UTC
    const expected = new Date("2024-01-14T21:00:00.000Z").getTime();
    expect(memoryService.getNextResetAt(before5am)).toBe(expected);
  });

  it("returns the next day's 5am MYT when called after 5am MYT", () => {
    // 06:00 MYT on 2024-01-15  →  2024-01-14 22:00 UTC
    const after5am = new Date("2024-01-14T22:00:00.000Z").getTime();
    // Expected reset: 2024-01-16 05:00 MYT = 2024-01-15 21:00 UTC
    const expected = new Date("2024-01-15T21:00:00.000Z").getTime();
    expect(memoryService.getNextResetAt(after5am)).toBe(expected);
  });

  it("returns exactly 5am MYT next day when called exactly at 5am MYT", () => {
    // 05:00 MYT on 2024-01-15  →  2024-01-14 21:00 UTC
    const exactly5am = new Date("2024-01-14T21:00:00.000Z").getTime();
    // h === RESET_HOUR_MYT (5), so condition h >= 5 is true → use tomorrow
    const expected = new Date("2024-01-15T21:00:00.000Z").getTime();
    expect(memoryService.getNextResetAt(exactly5am)).toBe(expected);
  });

  it("always returns a timestamp in the future relative to the input", () => {
    const now = Date.now();
    expect(memoryService.getNextResetAt(now)).toBeGreaterThan(now);
  });
});

// ─── getDailyCap ─────────────────────────────────────────────────────────────

describe("memoryService.getDailyCap / constants", () => {
  it("exports the free-tier cap", () => {
    expect(DAILY_CAP).toBe(40);
    expect(memoryService.getDailyCap()).toBe(DAILY_CAP);
  });

  it("premium cap is double the free cap", () => {
    expect(DAILY_CAP_PREMIUM).toBe(DAILY_CAP * 2);
  });
});

// ─── canSend ─────────────────────────────────────────────────────────────────

describe("memoryService.canSend", () => {
  beforeEach(() => {
    mockCurrentUser = { email: "student@test.com", uid: "user-abc" };
  });

  it("returns ok=true when under the free daily cap", async () => {
    mockGetDoc.mockResolvedValue(makeSnap(baseMem({ dailyMessages: 10 })));
    const result = await memoryService.canSend("user-abc");
    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(30);
    expect(result.limit).toBe(DAILY_CAP);
  });

  it("returns ok=false when at the free daily cap", async () => {
    mockGetDoc.mockResolvedValue(makeSnap(baseMem({ dailyMessages: 40 })));
    const result = await memoryService.canSend("user-abc");
    expect(result.ok).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("applies premium cap for subscribers", async () => {
    mockGetDoc.mockResolvedValue(
      makeSnap(baseMem({ dailyMessages: 50, isSubscriber: true }))
    );
    const result = await memoryService.canSend("user-abc");
    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(30);
    expect(result.limit).toBe(DAILY_CAP_PREMIUM);
  });

  it("returns ok=false when premium subscriber exhausts premium cap", async () => {
    mockGetDoc.mockResolvedValue(
      makeSnap(baseMem({ dailyMessages: 80, isSubscriber: true }))
    );
    const result = await memoryService.canSend("user-abc");
    expect(result.ok).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("grants unlimited messages to admin users", async () => {
    mockCurrentUser = { email: "msallehroslan@gmail.com", uid: "admin-1" };
    mockGetDoc.mockResolvedValue(makeSnap(baseMem({ dailyMessages: 999 })));
    const result = await memoryService.canSend("admin-1");
    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(999);
    expect(result.limit).toBe(999);
  });

  it("rolls over daily messages when reset boundary has passed", async () => {
    const PAST_RESET = Date.now() - 1000; // already in the past → should roll
    mockGetDoc.mockResolvedValue(
      makeSnap(baseMem({ dailyMessages: 39, dailyResetAt: PAST_RESET }))
    );
    const result = await memoryService.canSend("user-abc");
    // After roll, dailyMessages becomes 0
    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(DAILY_CAP);
  });
});

// ─── bumpMastery ─────────────────────────────────────────────────────────────

describe("memoryService.bumpMastery", () => {
  beforeEach(() => {
    mockCurrentUser = { email: "student@test.com", uid: "user-abc" };
    mockSetDoc.mockReset();
    mockSetDoc.mockResolvedValue(undefined);
  });

  function lastSetDocPayload() {
    const last = mockSetDoc.mock.calls.at(-1);
    if (!last) throw new Error("setDoc was never called");
    return last[1] as { mastery: Record<string, number> };
  }

  it("increments mastery for a topic", async () => {
    mockGetDoc.mockResolvedValue(
      makeSnap(baseMem({ mastery: { acids: 50 } }))
    );
    await memoryService.bumpMastery("user-abc", "acids", 10);
    expect(lastSetDocPayload().mastery.acids).toBe(60);
  });

  it("clamps mastery to maximum of 100", async () => {
    mockGetDoc.mockResolvedValue(
      makeSnap(baseMem({ mastery: { acids: 95 } }))
    );
    await memoryService.bumpMastery("user-abc", "acids", 20);
    expect(lastSetDocPayload().mastery.acids).toBe(100);
  });

  it("clamps mastery to minimum of 0", async () => {
    mockGetDoc.mockResolvedValue(
      makeSnap(baseMem({ mastery: { acids: 5 } }))
    );
    await memoryService.bumpMastery("user-abc", "acids", -20);
    expect(lastSetDocPayload().mastery.acids).toBe(0);
  });

  it("initialises mastery at 0 for a new topic", async () => {
    mockGetDoc.mockResolvedValue(makeSnap(baseMem({ mastery: {} })));
    await memoryService.bumpMastery("user-abc", "newTopic", 15);
    expect(lastSetDocPayload().mastery.newTopic).toBe(15);
  });

  it("does not affect mastery of other topics", async () => {
    mockGetDoc.mockResolvedValue(
      makeSnap(baseMem({ mastery: { acids: 60, bases: 40 } }))
    );
    await memoryService.bumpMastery("user-abc", "acids", 10);
    expect(lastSetDocPayload().mastery.bases).toBe(40);
  });
});

// ─── recordTurn — streak logic ────────────────────────────────────────────────

describe("memoryService.recordTurn streak logic", () => {
  beforeEach(() => {
    mockCurrentUser = { email: "student@test.com", uid: "user-abc" };
    mockBatchSet.mockReset();
    mockBatchCommit.mockResolvedValue(undefined);
  });

  it("preserves streak when sending multiple messages on the same MYT day", async () => {
    // lastActiveDay matches the current myDayKey → dayDiff === 0 → streak unchanged
    // We fake "today" as 2024-01-15 after 5am MYT.
    // 2024-01-15 06:00 MYT = 2024-01-14 22:00 UTC
    vi.setSystemTime(new Date("2024-01-14T22:00:00.000Z"));

    mockGetDoc.mockResolvedValue(
      makeSnap(baseMem({ currentStreak: 3, lastActiveDay: "2024-01-15" }))
    );

    const result = await memoryService.recordTurn("user-abc", {
      userMessage: { text: "Hello" },
    });

    expect(result.currentStreak).toBe(3);
    vi.useRealTimers();
  });

  it("increments streak by 1 on consecutive days", async () => {
    // "today" MYT = 2024-01-16 (06:00 MYT = 2024-01-15 22:00 UTC)
    vi.setSystemTime(new Date("2024-01-15T22:00:00.000Z"));

    mockGetDoc.mockResolvedValue(
      makeSnap(baseMem({ currentStreak: 3, lastActiveDay: "2024-01-15" }))
    );

    const result = await memoryService.recordTurn("user-abc", {
      userMessage: { text: "Hello" },
    });

    expect(result.currentStreak).toBe(4);
    vi.useRealTimers();
  });

  it("resets streak to 1 after a gap of 2+ days", async () => {
    // "today" MYT = 2024-01-20, lastActiveDay = 2024-01-15  (5 days ago)
    vi.setSystemTime(new Date("2024-01-19T22:00:00.000Z")); // 06:00 MYT Jan 20

    mockGetDoc.mockResolvedValue(
      makeSnap(baseMem({ currentStreak: 10, lastActiveDay: "2024-01-15" }))
    );

    const result = await memoryService.recordTurn("user-abc", {
      userMessage: { text: "Back after a break!" },
    });

    expect(result.currentStreak).toBe(1);
    vi.useRealTimers();
  });

  it("updates longestStreak when current streak exceeds it", async () => {
    vi.setSystemTime(new Date("2024-01-15T22:00:00.000Z")); // 06:00 MYT Jan 16

    mockGetDoc.mockResolvedValue(
      makeSnap(
        baseMem({ currentStreak: 7, longestStreak: 7, lastActiveDay: "2024-01-15" })
      )
    );

    const result = await memoryService.recordTurn("user-abc", {
      userMessage: { text: "Day 8!" },
    });

    expect(result.currentStreak).toBe(8);
    expect(result.longestStreak).toBe(8);
    vi.useRealTimers();
  });

  it("does NOT increment daily message count for admin users", async () => {
    mockCurrentUser = { email: "msallehroslan@gmail.com", uid: "admin-1" };
    vi.setSystemTime(new Date("2024-01-14T22:00:00.000Z"));

    mockGetDoc.mockResolvedValue(makeSnap(baseMem({ dailyMessages: 5 })));

    await memoryService.recordTurn("admin-1", {
      userMessage: { text: "Admin message" },
    });

    // The first call to batch.set() is the user doc — check increment value
    const userDocPayload = mockBatchSet.mock.calls[0][1] as {
      dailyMessages: { _increment: number };
    };
    expect(userDocPayload.dailyMessages._increment).toBe(0);
    vi.useRealTimers();
  });
});
