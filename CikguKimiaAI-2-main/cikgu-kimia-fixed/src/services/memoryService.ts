/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * memoryService — v2
 *
 * The original "Neural Energy" mechanic (5 pts per message, regen 10 pts/hr,
 * separate read-modify-write per turn) is replaced with a positive daily-budget
 * model. The student sees:
 *
 *   - Daily message budget   (e.g. 40 / day for free tier — resets 5am MYT)
 *   - Current streak         (consecutive days they used the app)
 *   - Chapter mastery        (0–100 per chapter, updated by quizzes / model)
 *
 * All updates flow through `recordTurn()` which performs ONE atomic Firestore
 * write per chat turn — replacing the previous 4–9 Firestore ops.
 *
 * The old `neuralEnergy` field is kept on the document for backward compat but
 * is no longer used by the UI.
 */

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  writeBatch,
  increment,
  collection,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export interface StudentMemory {
  weakTopics: string[];
  lastExamScore?: string;
  identifiedMistakes: string[];
  examPapersAnalysis: string[];
  form?: number; 

  // v2 fields
  dailyMessages?: number;        // count today, resets at 5am MYT
  dailyResetAt?: number;         // epoch ms of the next reset boundary
  currentStreak?: number;        // consecutive days with ≥ 1 message
  longestStreak?: number;
  lastActiveDay?: string;        // YYYY-MM-DD (MYT)
  mastery?: Record<string, number>;   // topicId → 0..100

  // legacy — kept for back-compat, no longer used
  neuralEnergy?: number;
  lastEnergyRefill?: number;
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

// ─── tunables ─────────────────────────────────────────────────────────────
export const DAILY_CAP = 40;            // messages per day, free tier
export const DAILY_CAP_PREMIUM = 200;
const RESET_HOUR_MYT = 5;               // 5am Malaysia time
const MYT_OFFSET_MIN = 8 * 60;          // UTC+8

const ADMIN_EMAILS = [
  "msallehroslan@gmail.com",
  "msallehroslan@gmail.form",
  "salleh@ioteratechnologies.com"
];

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Compute the next 5am MYT boundary (in epoch ms).
 * Used for friendly "resets at 5am" countdowns.
 */
function nextResetAt(now = Date.now()): number {
  const d = new Date(now + MYT_OFFSET_MIN * 60 * 1000);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  const h = d.getUTCHours();

  // boundary today at 05:00 MYT
  let boundaryUTCms = Date.UTC(y, m, day, RESET_HOUR_MYT, 0, 0) - MYT_OFFSET_MIN * 60 * 1000;
  if (h >= RESET_HOUR_MYT) {
    // already past today's reset → use tomorrow's
    boundaryUTCms += 24 * 60 * 60 * 1000;
  }
  return boundaryUTCms;
}

/** YYYY-MM-DD for the *current* MYT day, with day rolling over at 5am. */
function myDayKey(now = Date.now()): string {
  const shifted = new Date(now + MYT_OFFSET_MIN * 60 * 1000 - RESET_HOUR_MYT * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

// ─── error handling (preserved from v1) ───────────────────────────────────
interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const user = auth.currentUser;
  const info: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.uid,
      email: user?.email,
      emailVerified: user?.emailVerified,
      isAnonymous: user?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(info));
  throw new Error(JSON.stringify(info));
}

/** Default empty memory for a brand-new student. */
function emptyMemory(): StudentMemory {
  const today = myDayKey();
  return {
    weakTopics: [],
    identifiedMistakes: [],
    examPapersAnalysis: [],
    dailyMessages: 0,
    dailyResetAt: nextResetAt(),
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDay: today,
    mastery: {},
  };
}

/** Roll the daily counter if we've crossed the 5am MYT boundary. */
function rollIfNeeded(mem: StudentMemory): StudentMemory {
  const now = Date.now();
  if (!mem.dailyResetAt || now >= mem.dailyResetAt) {
    mem.dailyMessages = 0;
    mem.dailyResetAt = nextResetAt(now);
  }
  return mem;
}

// ─── public API ───────────────────────────────────────────────────────────
export const memoryService = {
  /**
   * Read the student's memory. Performs the daily-reset roll if needed.
   * Single Firestore read.
   */
  async getMemory(userId: string): Promise<StudentMemory> {
    const path = `users/${userId}`;
    try {
      const docRef = doc(db, path);
      const snap = await getDoc(docRef);

      let mem: StudentMemory;
      if (snap.exists()) {
        mem = snap.data() as StudentMemory;
        // Lazy initialise v2 fields if migrating
        mem.dailyMessages ??= 0;
        mem.dailyResetAt ??= nextResetAt();
        mem.currentStreak ??= 0;
        mem.longestStreak ??= 0;
        mem.lastActiveDay ??= myDayKey();
        mem.mastery ??= {};
      } else {
        mem = emptyMemory();
      }

      return rollIfNeeded(mem);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return emptyMemory();
    }
  },

  /**
   * Can the user send another message today? Pure check, no writes.
   * Returns {ok, remaining, resetAt}.
   */
  async canSend(userId: string, cap = DAILY_CAP): Promise<{ ok: boolean; remaining: number; resetAt: number }> {
    const userEmail = auth.currentUser?.email;
    if (isAdmin(userEmail)) {
      return { ok: true, remaining: 999, resetAt: nextResetAt() };
    }

    const mem = await this.getMemory(userId);
    const used = mem.dailyMessages ?? 0;
    return {
      ok: used < cap,
      remaining: Math.max(0, cap - used),
      resetAt: mem.dailyResetAt ?? nextResetAt(),
    };
  },

  /**
   * Record one chat turn in a SINGLE batched write:
   *   - increments dailyMessages
   *   - persists the user message and (if given) model message to /history
   *   - updates streak if this is the first message of a new day
   *
   * Returns the updated memory.
   */
  async recordTurn(
    userId: string,
    args: {
      topicId?: string;
      userMessage: { text: string; images?: { mimeType: string; data: string }[] };
      modelMessage?: { text: string };
    }
  ): Promise<StudentMemory> {
    const path = `users/${userId}`;
    const today = myDayKey();

    try {
      // Need current state for streak calc — but only one read.
      const mem = await this.getMemory(userId);

      // streak math (cheap, client-side)
      const last = mem.lastActiveDay ?? today;
      const dayDiff = daysBetween(last, today);
      let streak = mem.currentStreak ?? 0;
      if (dayDiff === 0) {
        // same day — no streak change
      } else if (dayDiff === 1) {
        streak += 1;
      } else {
        streak = 1; // broken streak; today starts fresh
      }
      const longest = Math.max(mem.longestStreak ?? 0, streak);

      // Build one atomic batch
      const batch = writeBatch(db);
      const userRef = doc(db, path);
      const histColl = collection(db, `users/${userId}/history`);

      const userEmail = auth.currentUser?.email;
      const isAdminUser = isAdmin(userEmail);

      batch.set(
        userRef,
        {
          dailyMessages: isAdminUser ? increment(0) : increment(1),
          dailyResetAt: mem.dailyResetAt,
          currentStreak: streak,
          longestStreak: longest,
          lastActiveDay: today,
          updatedAt: serverTimestamp(),
          uid: userId,
          email: userEmail ?? null,
        },
        { merge: true }
      );

      const userMsgRef = doc(histColl);
      batch.set(userMsgRef, {
        role: "user",
        text: args.userMessage.text,
        images: args.userMessage.images ?? [],
        userId,
        topicId: args.topicId ?? "general",
        timestamp: serverTimestamp(),
      });

      if (args.modelMessage) {
        const modelMsgRef = doc(histColl);
        batch.set(modelMsgRef, {
          role: "model",
          text: args.modelMessage.text,
          userId,
          topicId: args.topicId ?? "general",
          timestamp: serverTimestamp(),
        });
      }

      await batch.commit();

      // Return optimistically-updated memory (no extra read)
      return {
        ...mem,
        dailyMessages: (mem.dailyMessages ?? 0) + 1,
        currentStreak: streak,
        longestStreak: longest,
        lastActiveDay: today,
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return emptyMemory();
    }
  },

  /** Save partial memory (used by the analyser to add weakTopics / mistakes). */
  async saveMemory(userId: string, memory: Partial<StudentMemory>) {
    const path = `users/${userId}`;
    try {
      await setDoc(
        doc(db, path),
        { ...memory, uid: userId, email: auth.currentUser?.email, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async addWeakTopic(userId: string, topic: string) {
    const mem = await this.getMemory(userId);
    if (!mem.weakTopics.includes(topic)) {
      mem.weakTopics.push(topic);
      await this.saveMemory(userId, { weakTopics: mem.weakTopics });
    }
  },

  async addIdentifiedMistake(userId: string, mistake: string) {
    const mem = await this.getMemory(userId);
    if (!mem.identifiedMistakes.includes(mistake)) {
      mem.identifiedMistakes.push(mistake);
      await this.saveMemory(userId, { identifiedMistakes: mem.identifiedMistakes });
    }
  },

  async addExamAnalysis(userId: string, analysis: string) {
    const mem = await this.getMemory(userId);
    mem.examPapersAnalysis.push(analysis);
    if (mem.examPapersAnalysis.length > 5) mem.examPapersAnalysis.shift();
    await this.saveMemory(userId, { examPapersAnalysis: mem.examPapersAnalysis });
  },

  /** Bump chapter mastery (capped 0–100). Used by quiz / exam result handlers. */
  async bumpMastery(userId: string, topicId: string, delta: number) {
    const mem = await this.getMemory(userId);
    const current = (mem.mastery ?? {})[topicId] ?? 0;
    const next = Math.max(0, Math.min(100, current + delta));
    const mastery = { ...(mem.mastery ?? {}), [topicId]: next };
    await this.saveMemory(userId, { mastery });
  },

  // Public helpers
  getNextResetAt: nextResetAt,
  getDailyCap: () => DAILY_CAP,
};
