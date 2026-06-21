import { describe, it, expect, vi, beforeEach } from "vitest";
import { compressImageFile } from "../imageCompress";

// ─── mock helpers ─────────────────────────────────────────────────────────────

let mockImageNaturalWidth = 100;
let mockImageNaturalHeight = 100;

// Canvas mock — captures the dimensions assigned before toDataURL is called
let lastCanvasWidth = 0;
let lastCanvasHeight = 0;

const mockCtx = { drawImage: vi.fn() };

function buildCanvasMock() {
  const canvas = {
    get width() { return lastCanvasWidth; },
    set width(v: number) { lastCanvasWidth = v; },
    get height() { return lastCanvasHeight; },
    set height(v: number) { lastCanvasHeight = v; },
    getContext: vi.fn(() => mockCtx),
    toDataURL: vi.fn(() => "data:image/jpeg;base64,FAKEBASE64DATA=="),
  };
  return canvas;
}

// ─── per-test setup ───────────────────────────────────────────────────────────

beforeEach(() => {
  mockImageNaturalWidth = 100;
  mockImageNaturalHeight = 100;
  lastCanvasWidth = 0;
  lastCanvasHeight = 0;
  mockCtx.drawImage.mockReset();

  // Mock FileReader to immediately trigger onload with a fake data URL
  vi.stubGlobal(
    "FileReader",
    class MockFileReader {
      onload: ((e: any) => void) | null = null;
      onerror: ((e: any) => void) | null = null;

      readAsDataURL(_file: File) {
        queueMicrotask(() => {
          this.onload?.({
            target: { result: "data:image/jpeg;base64,ORIGINALDATA==" },
          });
        });
      }
    }
  );

  // Mock Image to use our configurable dimensions
  vi.stubGlobal(
    "Image",
    class MockImage {
      width = mockImageNaturalWidth;
      height = mockImageNaturalHeight;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_: string) {
        // Copy the current mock dimensions (set before calling compressImageFile)
        (this as any).width = mockImageNaturalWidth;
        (this as any).height = mockImageNaturalHeight;
        queueMicrotask(() => this.onload?.());
      }
    }
  );

  // Intercept document.createElement to return our canvas mock for 'canvas'
  const origCreateElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "canvas") return buildCanvasMock() as any;
    return origCreateElement(tag);
  });
});

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeFile(type = "image/jpeg", name = "photo.jpg"): File {
  return new File(["fake-image-bytes"], name, { type });
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe("compressImageFile", () => {
  it("rejects files that are not images", async () => {
    const pdf = new File(["content"], "notes.pdf", { type: "application/pdf" });
    await expect(compressImageFile(pdf)).rejects.toThrow("File is not an image");
  });

  it("rejects when the canvas 2D context is unavailable", async () => {
    // Override the canvas mock to return null for getContext
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") {
        return { getContext: () => null, width: 0, height: 0, toDataURL: vi.fn() } as any;
      }
      return origCreateElement(tag);
    });

    await expect(compressImageFile(makeFile())).rejects.toThrow(
      "Failed to get 2D context from canvas"
    );
  });

  it("does not scale images that fit within 1200×1200", async () => {
    mockImageNaturalWidth = 800;
    mockImageNaturalHeight = 600;

    await compressImageFile(makeFile());

    expect(lastCanvasWidth).toBe(800);
    expect(lastCanvasHeight).toBe(600);
  });

  it("scales landscape images so width becomes 1200 (proportional)", async () => {
    // 2400×960 → width capped at 1200, height = round(960*1200/2400) = 480
    mockImageNaturalWidth = 2400;
    mockImageNaturalHeight = 960;

    await compressImageFile(makeFile());

    expect(lastCanvasWidth).toBe(1200);
    expect(lastCanvasHeight).toBe(480);
  });

  it("scales portrait images so height becomes 1200 (proportional)", async () => {
    // 600×2400 → height capped at 1200, width = round(600*1200/2400) = 300
    mockImageNaturalWidth = 600;
    mockImageNaturalHeight = 2400;

    await compressImageFile(makeFile());

    expect(lastCanvasWidth).toBe(300);
    expect(lastCanvasHeight).toBe(1200);
  });

  it("scales a square image that exceeds max to 1200×1200", async () => {
    mockImageNaturalWidth = 3000;
    mockImageNaturalHeight = 3000;

    await compressImageFile(makeFile());

    expect(lastCanvasWidth).toBe(1200);
    expect(lastCanvasHeight).toBe(1200);
  });

  it("returns base64 without the data URL prefix", async () => {
    const result = await compressImageFile(makeFile());
    expect(result.base64).not.toContain("data:");
    expect(result.base64).not.toContain(";base64,");
    expect(result.base64).toBe("FAKEBASE64DATA==");
  });

  it("returns 'image/jpeg' as mimeType regardless of input format", async () => {
    const png = makeFile("image/png", "photo.png");
    const result = await compressImageFile(png);
    expect(result.mimeType).toBe("image/jpeg");
  });

  it("returns preview as a full data URL", async () => {
    const result = await compressImageFile(makeFile());
    expect(result.preview).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("reports originalBytes equal to the file size", async () => {
    const file = makeFile();
    const result = await compressImageFile(file);
    expect(result.originalBytes).toBe(file.size);
  });
});
