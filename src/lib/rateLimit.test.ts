import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { rateLimit } from "./rateLimit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", () => {
    const key = `test-under-${Math.random()}`;
    expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    expect(rateLimit(key, 3, 60_000).ok).toBe(true);
  });

  it("blocks the request once the limit is reached", () => {
    const key = `test-block-${Math.random()}`;
    rateLimit(key, 2, 60_000);
    rateLimit(key, 2, 60_000);
    const result = rateLimit(key, 2, 60_000);
    expect(result.ok).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps separate counters per key", () => {
    const keyA = `test-a-${Math.random()}`;
    const keyB = `test-b-${Math.random()}`;
    rateLimit(keyA, 1, 60_000);
    // keyA is now exhausted, keyB should be unaffected.
    expect(rateLimit(keyA, 1, 60_000).ok).toBe(false);
    expect(rateLimit(keyB, 1, 60_000).ok).toBe(true);
  });

  it("resets the counter once the window has passed", () => {
    const key = `test-reset-${Math.random()}`;
    rateLimit(key, 1, 60_000);
    expect(rateLimit(key, 1, 60_000).ok).toBe(false);

    vi.setSystemTime(60_001);

    expect(rateLimit(key, 1, 60_000).ok).toBe(true);
  });
});
