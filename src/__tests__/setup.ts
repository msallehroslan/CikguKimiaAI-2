import { vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
