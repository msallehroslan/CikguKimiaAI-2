# Panduan Deploy ke Render

Aplikasi ini sudah dikonfigurasi untuk sedia dideploy ke Render.com (Full-stack Node.js).

### Langkah-langkah:
1. **Repository**: Pastikan kod ini ada di GitHub/GitLab anda.
2. **Render Blueprint**: 
   - Render akan secara automatik mengesan fail `render.yaml`.
   - Pergi ke [Dashboard Render](https://dashboard.render.com/) -> **New** -> **Blueprint**.
   - Pilih repo anda.
3. **Konfigurasi Environment Variables**:
   Di dashboard Render, anda WAJIB masukkan nilai untuk:
   - `GEMINI_API_KEY`: Kunci API Google AI Studio anda.
   - `TELEGRAM_BOT_TOKEN`: Token dari @BotFather (jika mahu guna Telegram).
   - `APP_URL`: URL penuh aplikasi anda di Render (contoh: `https://cikgu-kimia.onrender.com`) untuk fungsi Telegram Webhook.

### Nota Kos & Bil:
- **Pelan Percuma**: Kebiasaannya untuk 100-200 pengguna, anda akan kekal dalam "Free Tier" Google (bil RM0.00).
- **Billing Account**: Anda perlu pautkan kad untuk pengesahan identiti di Google Cloud.
- **Budget Alert**: Sangat disarankan untuk set "Budget Alert" sebanyak RM5.00 di Google Cloud Console supaya anda sentiasa tenang.

### Nota Penting:
- **Firebase**: Fail `firebase-applet-config.json` perlu ada dalam repository. Jika anda tidak mahu ia dalam GitHub, anda boleh mengubahsuai `src/lib/firebase.ts` untuk menggunakan environment variables.
- **Port**: Aplikasi akan secara automatik menggunakan port yang ditetapkan oleh Render (biasanya 10000) atau default 3000.
