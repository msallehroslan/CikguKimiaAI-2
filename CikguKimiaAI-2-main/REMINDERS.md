# Reminder system — deployment notes

The client side is in `src/services/reminderService.ts`. The **sending half** is a scheduled job — pick one of the two options below.

## Option A — Cloud Functions for Firebase (recommended)

```bash
firebase init functions   # TypeScript
cd functions
npm install firebase-admin node-telegram-bot-api
```

`functions/src/sendReminders.ts`:

```ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const sendDailyReminders = functions
  .region("asia-southeast1")
  .pubsub.schedule("0 19 * * *")          // every day at 7pm MYT
  .timeZone("Asia/Kuala_Lumpur")
  .onRun(async () => {
    const db = admin.firestore();
    const snap = await db.collection("users").get();

    for (const userDoc of snap.docs) {
      const u = userDoc.data();
      const prefs = u.reminderPrefs;
      if (!prefs || prefs.channel === "off") continue;

      const lastActive = u.lastActiveDay
        ? Math.floor((Date.now() - Date.parse(u.lastActiveDay)) / 86_400_000)
        : 999;

      // Only nudge users gone 2–14 days; don't pester active users or fully-lapsed ones
      if (lastActive < 2 || lastActive > 14) continue;

      // Don't double-send within 24h
      if (prefs.lastSent && Date.now() - prefs.lastSent < 86_400_000) continue;

      const weakTopic = (u.weakTopics ?? [])[0];
      const message = weakTopic
        ? `🧪 Anda tinggalkan ${weakTopic} ${lastActive} hari lepas. Cuba 3 soalan ringkas hari ini? https://cikgu.iotera.com.my`
        : `🧪 Sudah ${lastActive} hari tak belajar Kimia. Datang balik dan teruskan streak anda! https://cikgu.iotera.com.my`;

      if (prefs.channel === "telegram" && prefs.telegramChatId) {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: prefs.telegramChatId, text: message }),
        });
      }

      await userDoc.ref.update({ "reminderPrefs.lastSent": Date.now() });
    }
  });
```

Deploy:
```bash
firebase deploy --only functions:sendDailyReminders
```

## Option B — Render / Cloud Run cron

Add to your Render dashboard or as a Cloud Scheduler entry hitting an endpoint like `/api/cron/send-reminders` on your existing server. Inside the handler, run the same logic above. **Protect the endpoint** with `?secret=...` checked against `process.env.CRON_SECRET`.

## Linking Telegram to user account

Add a `/link` command to the existing Telegraf bot:

```ts
bot.command("link", async (ctx) => {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  await db.collection("telegram_link_codes").doc(code).set({
    chatId: ctx.from.id,
    createdAt: serverTimestamp(),
  });
  await ctx.reply(
    `Tunjuk kod ini di aplikasi web untuk pasangkan akaun anda:\n\n<b>${code}</b>\n\nKod tamat tempoh dalam 5 minit.`,
    { parse_mode: "HTML" }
  );
});
```

Then expose a settings page in the web app where the student types in the code; the server looks it up in `telegram_link_codes`, copies the `chatId` into the user's `reminderPrefs`, and deletes the code.

## What to surface in the web app

Add a small settings panel (we'd recommend inside the Progres saya / MemoryPanel) with three controls:
- Channel: Off · Telegram · In-app
- Preferred hour (0–23)
- "Link Telegram" button → shows the code-entry dialog

The `reminderService.setPrefs(uid, ...)` function persists those choices to Firestore — no further wiring needed.

## Sanity checks before going live

- [ ] CRON_SECRET set in production env
- [ ] Cloud Function scheduled in `Asia/Kuala_Lumpur`
- [ ] Test with a single user before broadcasting
- [ ] Add an unsubscribe link in every message
- [ ] Comply with PDPA — explicit consent required (the channel=off default ensures this)
