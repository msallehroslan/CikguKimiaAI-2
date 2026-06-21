/**
 * reminderService.ts
 * Client-side reminder preference management.
 * Persists user choices to Firestore via memoryService helpers.
 */

import { db } from "../lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

export type ReminderChannel = "off" | "telegram" | "in-app";

export interface ReminderPrefs {
  channel: ReminderChannel;
  preferredHour: number;   // 0–23 (user's local hour)
  telegramChatId?: number; // set after Telegram link flow
  lastSent?: number;       // epoch ms — set by server cron
}

const DEFAULT_PREFS: ReminderPrefs = {
  channel: "off",   // opt-in only (PDPA compliance)
  preferredHour: 19,
};

/**
 * Persist reminder preferences for a user.
 */
export async function setPrefs(uid: string, prefs: Partial<ReminderPrefs>): Promise<void> {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    reminderPrefs: { ...DEFAULT_PREFS, ...prefs },
    updatedAt: serverTimestamp(),
  });
}

/**
 * Link a Telegram chatId to the user's account via a short-lived code.
 * The server validates the code and writes telegramChatId.
 *
 * Usage:
 *   1. User calls /link in the Telegram bot → bot returns a 6-char code.
 *   2. User types the code in the web app settings.
 *   3. Client calls linkTelegram(uid, code).
 *   4. Server looks up the code, copies the chatId, deletes the code.
 */
export async function linkTelegram(uid: string, code: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/telegram-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, code }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error || "Kod tidak sah atau tamat tempoh." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal menghubungi pelayan. Cuba lagi." };
  }
}

/**
 * Disable all reminders for a user (sets channel to "off").
 */
export async function disableReminders(uid: string): Promise<void> {
  await setPrefs(uid, { channel: "off" });
}
