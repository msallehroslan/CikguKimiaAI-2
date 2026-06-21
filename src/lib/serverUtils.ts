/**
 * Pure server-side utility functions extracted for testability.
 * Imported by server.ts and directly tested in serverUtils.test.ts.
 */

export async function retryGeminiCall<T>(
  call: () => Promise<T>,
  retries = 5,
  backoff = 3000
): Promise<T> {
  try {
    return await call();
  } catch (error: any) {
    if ((error?.status === 503 || error?.status === 429) && retries > 0) {
      console.warn(
        `Gemini ${error?.status || "5xx"} — retrying in ${backoff}ms (${retries} left)`
      );
      await new Promise((r) => setTimeout(r, backoff));
      return retryGeminiCall(call, retries - 1, backoff * 2);
    }
    throw error;
  }
}

export function parseGeminiError(error: any, defaultMsg: string): string {
  const errText = error?.message || (typeof error === "string" ? error : "");
  const errStr = (errText + " " + JSON.stringify(error)).toLowerCase();

  if (
    errStr.includes("api key not valid") ||
    errStr.includes("api_key_invalid") ||
    errStr.includes("invalid api key") ||
    errStr.includes("api key is not valid") ||
    errStr.includes("key is not valid") ||
    (error?.status === 400 && errStr.includes("key"))
  ) {
    return "Ralat Kunci API (API Key Error): Sila pastikan GEMINI_API_KEY yang sah telah dimasukkan dalam Settings / fail .env anda. 🔑";
  }
  if (error?.status === 429) {
    return "Sistem sedang sibuk (Had Penggunaan / Rate Limit). Cuba lagi dalam beberapa saat. ⏳";
  }
  if (error?.status === 503) {
    return "Cikgu sedang dikerumuni ramai pelajar (Service Unavailable)! Sila hantar semula mesej anda dalam beberapa saat. 🙏";
  }
  return defaultMsg;
}

export function formatForTelegram(text: string): string {
  const cleaned = text
    .replace(/\[CONTEXT SHIFT DETECTED\]:.*?\n/g, "")
    .replace(/\[MASTERY\][^\n]*\n?/g, "")
    .replace(/\[NEURAL_INSIGHT\][^\n]*\n?/g, "");
  let formatted = cleaned.replace(
    /```svg\s*[\s\S]*?\s*```/g,
    () =>
      "\n\n[📊 <b>Rajah Kimia</b>: Tekan butang di bawah untuk lihat rajah penuh dalam web app]\n\n"
  );
  formatted = formatted
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  formatted = formatted.replace(/^\s*[\-\*] (.*$)/gm, "• $1");
  formatted = formatted.replace(/^\s*\d+\. (.*$)/gm, "$1");
  formatted = formatted.replace(/^#{1,4} (.*$)/gm, "<b>$1</b>");
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  formatted = formatted.replace(/__(.*?)__/g, "<b>$1</b>");
  formatted = formatted.replace(
    /(^|\s)\*(?!\s)(.*?)(?<!\s)\*($|\s)/g,
    "$1<i>$2</i>$3"
  );
  formatted = formatted.replace(
    /(^|\s)_(?!\s)(.*?)(?<!\s)_($|\s)/g,
    "$1<i>$2</i>$3"
  );
  formatted = formatted.replace(
    /\$?([A-Z][a-z]?)_\{?(\d+)\}?\$?/g,
    "$1<sub>$2</sub>"
  );
  formatted = formatted.replace(
    /\$?([A-Z][a-z]?)\^\{?([\+\-0-9a-z\(\)]+)\}?\$?/g,
    "$1<sup>$2</sup>"
  );
  formatted = formatted.replace(
    /\$?([A-Z][a-z]?)_\{?(\d+)\}?\^\{?([\+\-0-9a-z]+)\}?\$?/g,
    "$1<sub>$2</sub><sup>$3</sup>"
  );
  formatted = formatted.replace(/\$/g, "");
  formatted = formatted
    .replace(/\\rightarrow/g, "→")
    .replace(/\\leftarrow/g, "←")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\times/g, "×")
    .replace(/\\degree/g, "°")
    .replace(/---/g, "────────────────");
  return formatted.trim();
}
