import { describe, expect, it } from "vitest";
import { MAX_NAME_LENGTH, normalizeNames } from "./names";

describe("normalizeNames", () => {
  it("trims and drops empty entries", () => {
    expect(normalizeNames(["  Anna ", "", "   ", "Erik"], 10).names).toEqual(["Anna", "Erik"]);
  });

  it("removes case-insensitive duplicates, keeping the first spelling", () => {
    expect(normalizeNames(["Anna", "anna", "ANNA ", "Erik"], 10).names).toEqual(["Anna", "Erik"]);
  });

  it("caps each name at the maximum length", () => {
    const { names } = normalizeNames(["x".repeat(MAX_NAME_LENGTH + 50)], 10);
    expect(names[0]).toHaveLength(MAX_NAME_LENGTH);
  });

  it("flags more distinct names than allowed, but not duplicates", () => {
    expect(normalizeNames(["a", "b", "c"], 2).tooMany).toBe(true);
    expect(normalizeNames(["a", "A", "b"], 2).tooMany).toBe(false);
  });

  it("handles an empty list", () => {
    expect(normalizeNames([], 5)).toEqual({ names: [], tooMany: false });
  });
});
