import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface ReminderPrefs {
  channel: "off" | "telegram" | "in-app";
  preferredHour: number; // 0-23
  telegramChatId?: number | null;
  lastSent?: number | null;
}

export const reminderService = {
  async setPrefs(userId: string, prefs: Partial<ReminderPrefs>) {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const existingPrefs = userSnap.exists() ? (userSnap.data().reminderPrefs || {}) : {};
    
    const newPrefs = {
      channel: "off",
      preferredHour: 19, // default 7 PM
      ...existingPrefs,
      ...prefs,
    };

    await setDoc(userRef, { reminderPrefs: newPrefs }, { merge: true });
    return newPrefs as ReminderPrefs;
  },

  async linkTelegram(userId: string, code: string): Promise<{ success: boolean; message: string; telegramChatId?: number | null }> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: "Kod tidak boleh kosong." };
    }

    const codeRef = doc(db, "telegram_link_codes", cleanCode);
    const codeSnap = await getDoc(codeRef);

    if (!codeSnap.exists()) {
      return { success: false, message: "Kod pautan tidak sah atau telah tamat tempoh." };
    }

    const data = codeSnap.data();
    const chatId = data.chatId;
    const createdAt = data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now());

    // 5 minutes expiry check
    if (Date.now() - createdAt > 5 * 60 * 1000) {
      await deleteDoc(codeRef);
      return { success: false, message: "Kod pautan telah tamat tempoh (lebih 5 minit)." };
    }

    // Set user's telegram ID
    await this.setPrefs(userId, {
      channel: "telegram",
      telegramChatId: chatId,
    });

    // Delete the code
    await deleteDoc(codeRef);

    return { success: true, message: "Berjaya menghubungkan akaun Telegram anda!", telegramChatId: chatId };
  }
};
