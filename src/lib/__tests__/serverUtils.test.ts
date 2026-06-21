import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  retryGeminiCall,
  parseGeminiError,
  formatForTelegram,
} from "../serverUtils";

// ─── retryGeminiCall ─────────────────────────────────────────────────────────

describe("retryGeminiCall", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the result immediately when the call succeeds", async () => {
    const call = vi.fn().mockResolvedValue("ok");
    const result = await retryGeminiCall(call, 3, 100);
    expect(result).toBe("ok");
    expect(call).toHaveBeenCalledTimes(1);
  });

  it("retries once on a 429 and returns on second attempt", async () => {
    const call = vi
      .fn()
      .mockRejectedValueOnce({ status: 429 })
      .mockResolvedValueOnce("retried");
    const promise = retryGeminiCall(call, 1, 100);
    await vi.runAllTimersAsync();
    expect(await promise).toBe("retried");
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("retries on 503 as well", async () => {
    const call = vi
      .fn()
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValueOnce("done");
    const promise = retryGeminiCall(call, 1, 100);
    await vi.runAllTimersAsync();
    expect(await promise).toBe("done");
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("throws after exhausting all retries", async () => {
    const err = { status: 429 };
    const call = vi.fn().mockRejectedValue(err);
    // Attach the rejection handler BEFORE advancing timers to avoid unhandled rejection warnings
    const assertion = expect(retryGeminiCall(call, 2, 100)).rejects.toMatchObject(err);
    await vi.runAllTimersAsync();
    await assertion;
    expect(call).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it("does NOT retry on a non-429/503 error", async () => {
    const err = { status: 500, message: "Internal Server Error" };
    const call = vi.fn().mockRejectedValue(err);
    await expect(retryGeminiCall(call, 3, 100)).rejects.toMatchObject(err);
    expect(call).toHaveBeenCalledTimes(1);
  });

  it("doubles the backoff on each successive retry", async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const call = vi
      .fn()
      .mockRejectedValueOnce({ status: 429 })
      .mockRejectedValueOnce({ status: 429 })
      .mockResolvedValueOnce("ok");
    const promise = retryGeminiCall(call, 2, 1000);
    await vi.runAllTimersAsync();
    await promise;
    const delays = setTimeoutSpy.mock.calls.map((c) => c[1]);
    expect(delays).toContain(1000);
    expect(delays).toContain(2000);
  });
});

// ─── parseGeminiError ─────────────────────────────────────────────────────────

describe("parseGeminiError", () => {
  const DEFAULT = "Ralat tidak diketahui.";

  it("returns API key error message for 'api key not valid' in message", () => {
    const result = parseGeminiError(
      { message: "API key not valid. Please pass a valid API key." },
      DEFAULT
    );
    expect(result).toContain("API Key Error");
    expect(result).toContain("GEMINI_API_KEY");
  });

  it("returns API key error message for 'api_key_invalid' string", () => {
    const result = parseGeminiError({ message: "api_key_invalid" }, DEFAULT);
    expect(result).toContain("API Key Error");
  });

  it("returns API key error message for status 400 with 'key' in message", () => {
    const result = parseGeminiError(
      { status: 400, message: "Bad Request: key is missing" },
      DEFAULT
    );
    expect(result).toContain("API Key Error");
  });

  it("returns rate-limit message for status 429", () => {
    const result = parseGeminiError({ status: 429, message: "Too Many Requests" }, DEFAULT);
    expect(result).toContain("Rate Limit");
    expect(result).toContain("⏳");
  });

  it("returns service-unavailable message for status 503", () => {
    const result = parseGeminiError({ status: 503, message: "Service Unavailable" }, DEFAULT);
    expect(result).toContain("Service Unavailable");
    expect(result).toContain("🙏");
  });

  it("returns the defaultMsg for an unrecognised error", () => {
    const result = parseGeminiError({ status: 418, message: "I'm a teapot" }, DEFAULT);
    expect(result).toBe(DEFAULT);
  });

  it("handles a plain string error", () => {
    const result = parseGeminiError("api_key_invalid", DEFAULT);
    expect(result).toContain("API Key Error");
  });

  it("handles a null/undefined error without throwing", () => {
    expect(() => parseGeminiError(null, DEFAULT)).not.toThrow();
    expect(() => parseGeminiError(undefined, DEFAULT)).not.toThrow();
  });
});

// ─── formatForTelegram ────────────────────────────────────────────────────────

describe("formatForTelegram", () => {
  it("strips [MASTERY] marker lines", () => {
    const result = formatForTelegram("Good job!\n[MASTERY] f4-c2 +10\nKeep going.");
    expect(result).not.toContain("[MASTERY]");
    expect(result).toContain("Good job!");
    expect(result).toContain("Keep going.");
  });

  it("strips [NEURAL_INSIGHT] marker lines", () => {
    const result = formatForTelegram("Note:\n[NEURAL_INSIGHT] (Redox) Students often forget.\nEnd.");
    expect(result).not.toContain("[NEURAL_INSIGHT]");
  });

  it("strips [CONTEXT SHIFT DETECTED] marker lines", () => {
    const result = formatForTelegram("[CONTEXT SHIFT DETECTED]: Student is now asking about acids.\nNew topic.");
    expect(result).not.toContain("[CONTEXT SHIFT DETECTED]");
    expect(result).toContain("New topic.");
  });

  it("replaces SVG code blocks with a fallback message", () => {
    const input = "See diagram:\n```svg\n<svg viewBox='0 0 100 100'></svg>\n```\nEnd.";
    const result = formatForTelegram(input);
    expect(result).not.toContain("<svg");
    expect(result).toContain("Rajah Kimia");
  });

  it("escapes HTML special characters to prevent injection", () => {
    const result = formatForTelegram("3 < 4 & 5 > 2");
    expect(result).toContain("&lt;");
    expect(result).toContain("&gt;");
    expect(result).toContain("&amp;");
  });

  it("converts markdown headers to HTML bold", () => {
    const result = formatForTelegram("## Tajuk Utama");
    expect(result).toContain("<b>Tajuk Utama</b>");
  });

  it("converts **bold** to <b>bold</b>", () => {
    const result = formatForTelegram("This is **penting**.");
    expect(result).toContain("<b>penting</b>");
  });

  it("converts markdown bullets to bullet points", () => {
    const result = formatForTelegram("- Item satu\n- Item dua");
    expect(result).toContain("• Item satu");
    expect(result).toContain("• Item dua");
  });

  it("converts chemical subscript notation to HTML subscript", () => {
    const result = formatForTelegram("Formula: H_2O");
    expect(result).toContain("H<sub>2</sub>O");
  });

  it("converts chemical superscript notation to HTML superscript", () => {
    const result = formatForTelegram("Ion: Na^+");
    expect(result).toContain("Na<sup>+</sup>");
  });

  it("converts LaTeX arrows to unicode", () => {
    const result = formatForTelegram("A \\rightarrow B");
    expect(result).toContain("A → B");
  });

  it("removes bare dollar signs (LaTeX delimiters)", () => {
    const result = formatForTelegram("Equation: $H_2O$");
    expect(result).not.toContain("$");
  });

  it("returns a trimmed string", () => {
    const result = formatForTelegram("   Hello   ");
    expect(result).toBe("Hello");
  });
});
