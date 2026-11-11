import { describe, expect, it } from "vitest";
import { isPastDeadline } from "./utils";

describe("isPastDeadline", () => {
  const now = new Date("2026-11-11T12:00:00Z");

  it("is false without a deadline", () => {
    expect(isPastDeadline(null, now)).toBe(false);
  });

  it("treats the deadline day itself as on time", () => {
    expect(isPastDeadline("2026-11-11", now)).toBe(false);
    expect(isPastDeadline("2026-12-01", now)).toBe(false);
  });

  it("is true once the deadline day has passed", () => {
    expect(isPastDeadline("2026-11-10", now)).toBe(true);
    expect(isPastDeadline("2026-07-23", now)).toBe(true);
  });

  it("uses the Swedish date, not UTC", () => {
    // 23:30 UTC on 11 Nov is already 12 Nov in Stockholm.
    expect(isPastDeadline("2026-11-11", new Date("2026-11-11T23:30:00Z"))).toBe(true);
  });
});
