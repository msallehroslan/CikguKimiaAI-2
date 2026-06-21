import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── mocks ───────────────────────────────────────────────────────────────────

const mockCanSend = vi.fn();
const mockGetMemory = vi.fn();
const mockRecordTurn = vi.fn();

vi.mock("../../services/memoryService", async (importActual) => {
  const actual = await importActual<typeof import("../../services/memoryService")>();
  return {
    ...actual,
    memoryService: {
      ...actual.memoryService,
      getMemory: (...a: any[]) => mockGetMemory(...a),
      canSend: (...a: any[]) => mockCanSend(...a),
      recordTurn: (...a: any[]) => mockRecordTurn(...a),
      bumpMastery: vi.fn().mockResolvedValue(undefined),
      saveMemory: vi.fn().mockResolvedValue(undefined),
      getNextResetAt: () => Date.now() + 86_400_000,
      getDailyCap: () => 40,
    },
  };
});

vi.mock("../../lib/FirebaseProvider", () => {
  // Create stable object references so React's effect deps don't see new objects on every render
  const _user = { uid: "test-uid", email: "student@test.com", displayName: "Test Student" };
  const _logout = vi.fn();
  return {
    useFirebase: vi.fn(() => ({ user: _user, logout: _logout, isSubscriber: false })),
  };
});

vi.mock("../../lib/firebase", () => ({
  db: {},
  auth: { currentUser: { email: "student@test.com" } },
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn(),
  writeBatch: vi.fn(),
  increment: vi.fn(),
  addDoc: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock("../../lib/imageCompress", () => ({
  compressImageFile: vi.fn().mockResolvedValue({
    base64: "FAKEBASE64",
    preview: "data:image/jpeg;base64,FAKEBASE64",
    mimeType: "image/jpeg",
    originalBytes: 1000,
    compressedBytes: 500,
  }),
}));

vi.mock("../../services/geminiService", () => ({
  GeminiService: class {
    sendMessageStream = vi.fn().mockResolvedValue(undefined);
    analyzeForMemory = vi.fn().mockResolvedValue({});
    summariseThread = vi.fn().mockResolvedValue("");
  },
}));

vi.mock("../../lib/qaCache", () => ({
  qaCache: { hit: vi.fn(() => null), set: vi.fn() },
}));

// motion/react: replace animated elements with plain HTML equivalents
vi.mock("motion/react", () => {
  function makeEl(tag: string) {
    return function MotionEl({ children, ...props }: Record<string, any>) {
      const { initial, animate, exit, variants, layout, transition, ...rest } = props;
      return React.createElement(tag, rest, children);
    };
  }
  return {
    motion: {
      div: makeEl("div"),
      span: makeEl("span"),
      button: makeEl("button"),
      ul: makeEl("ul"),
      li: makeEl("li"),
    },
    AnimatePresence: function AnimatePresence({ children }: any) { return children; },
  };
});

// Sub-components irrelevant to these tests
vi.mock("../CapDialog", () => ({
  CapDialog: function CapDialog() {
    return React.createElement("div", { "data-testid": "cap-dialog" }, "Quota reached");
  },
}));
vi.mock("../MemoryPanel", () => ({ MemoryPanel: () => null }));
vi.mock("../ResetConfirmDialog", () => ({ ResetConfirmDialog: () => null }));
vi.mock("../EquationBalancer", () => ({ EquationBalancer: () => null }));
vi.mock("../PeriodicTable", () => ({ PeriodicTable: () => null }));

// Stub markdown pipeline (no actual rendering needed)
vi.mock("react-markdown", () => ({
  default: function Markdown({ children }: any) {
    return React.createElement("div", null, children);
  },
}));
vi.mock("remark-gfm", () => ({ default: function remarkGfm() {} }));
vi.mock("remark-math", () => ({ default: function remarkMath() {} }));
vi.mock("rehype-katex", () => ({ default: function rehypeKatex() {} }));

// ─── actual imports (after all vi.mock declarations) ─────────────────────────

import { cleanMessageText, Chat } from "../Chat";

// ─── fixtures ─────────────────────────────────────────────────────────────────

const BASE_MEMORY = {
  weakTopics: [],
  identifiedMistakes: [],
  examPapersAnalysis: [],
  dailyMessages: 5,
  dailyResetAt: Date.now() + 86_400_000,
  currentStreak: 1,
  longestStreak: 1,
  lastActiveDay: "2024-01-15",
  mastery: {},
};

// ─── cleanMessageText unit tests ──────────────────────────────────────────────

describe("cleanMessageText", () => {
  it("removes [MASTERY] marker lines", () => {
    const text = "Great answer!\n[MASTERY] f4-c2 +10\nKeep it up.";
    expect(cleanMessageText(text)).not.toContain("[MASTERY]");
    expect(cleanMessageText(text)).toContain("Great answer!");
    expect(cleanMessageText(text)).toContain("Keep it up.");
  });

  it("removes [NEURAL_INSIGHT] marker lines", () => {
    const text = "Lesson:\n[NEURAL_INSIGHT] (Redox) Common error.\nEnd.";
    expect(cleanMessageText(text)).not.toContain("[NEURAL_INSIGHT]");
    expect(cleanMessageText(text)).toContain("Lesson:");
  });

  it("removes [CONTEXT SHIFT DETECTED] lines", () => {
    const text = "[CONTEXT SHIFT DETECTED]: Student is now asking about acids.\nNew topic.";
    expect(cleanMessageText(text)).not.toContain("[CONTEXT SHIFT DETECTED]");
    expect(cleanMessageText(text)).toContain("New topic.");
  });

  it("returns an empty string for empty input", () => {
    expect(cleanMessageText("")).toBe("");
  });

  it("trims surrounding whitespace", () => {
    expect(cleanMessageText("  hello  ")).toBe("hello");
  });

  it("leaves regular chemistry text unchanged", () => {
    const plain = "Asid ialah bahan yang menghasilkan ion H+ dalam air.";
    expect(cleanMessageText(plain)).toBe(plain);
  });
});

// ─── Chat component tests ─────────────────────────────────────────────────────

describe("Chat component", () => {
  beforeEach(() => {
    mockGetMemory.mockResolvedValue(BASE_MEMORY);
    mockRecordTurn.mockResolvedValue({ ...BASE_MEMORY, dailyMessages: 6 });
  });

  async function renderAndWait() {
    render(React.createElement(Chat));
    // Wait for history-loading spinner to disappear
    await waitFor(
      () => expect(screen.queryByText(/Menganalisis sejarah/i)).not.toBeInTheDocument(),
      { timeout: 3000 }
    );
  }

  it("shows CapDialog when the daily quota is exhausted", async () => {
    mockCanSend.mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 3_600_000, limit: 40 });
    await renderAndWait();

    const textarea = screen.getByRole("textbox");
    await userEvent.type(textarea, "Apa itu asid?");
    fireEvent.submit(textarea.closest("form")!);

    await waitFor(() => expect(screen.getByTestId("cap-dialog")).toBeInTheDocument(), { timeout: 3000 });
  });

  it("does NOT show CapDialog when quota is available", async () => {
    mockCanSend.mockResolvedValue({ ok: true, remaining: 35, resetAt: Date.now() + 3_600_000, limit: 40 });
    await renderAndWait();

    const textarea = screen.getByRole("textbox");
    await userEvent.type(textarea, "Apa itu asid?");
    fireEvent.submit(textarea.closest("form")!);

    await new Promise((r) => setTimeout(r, 100));
    expect(screen.queryByTestId("cap-dialog")).not.toBeInTheDocument();
  });

  it("alerts when a non-image/pdf/text file is uploaded", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(function() {});
    await renderAndWait();

    const fileInput = document.querySelector(
      'input[type="file"][accept="image/*,application/pdf,text/plain"]'
    ) as HTMLInputElement;

    const badFile = new File(["data"], "report.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    // applyAccept: false bypasses the browser's accept-filter so the change event fires for disallowed types
    const user = userEvent.setup({ applyAccept: false });
    await user.upload(fileInput, badFile);

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("Gambar"));
  });

  it("send button is disabled when the textarea is empty", async () => {
    await renderAndWait();
    const sendBtn = screen.getByRole("button", { name: /Hantar/i });
    expect(sendBtn).toBeDisabled();
  });

  it("send button becomes enabled after typing", async () => {
    await renderAndWait();
    const sendBtn = screen.getByRole("button", { name: /Hantar/i });
    expect(sendBtn).toBeDisabled();
    await userEvent.type(screen.getByRole("textbox"), "Hello");
    expect(sendBtn).not.toBeDisabled();
  });
});
