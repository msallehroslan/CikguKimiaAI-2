import { vi, beforeEach, afterEach } from "vitest";

// Reset localStorage between tests
beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});
