import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./safeRedirect";

describe("safeRedirectPath", () => {
  it("allows same-site relative paths, keeping query and hash", () => {
    expect(safeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("/collections/abc?tab=1#top")).toBe("/collections/abc?tab=1#top");
  });

  it("falls back for empty or missing values", () => {
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
    expect(safeRedirectPath("")).toBe("/dashboard");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("//evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("//evil.com/path")).toBe("/dashboard");
    expect(safeRedirectPath("/\\evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/dashboard");
  });

  it("rejects userinfo tricks that only work when appended to an origin", () => {
    expect(safeRedirectPath("@evil.com")).toBe("/dashboard");
    expect(safeRedirectPath(".evil.com")).toBe("/dashboard");
    expect(safeRedirectPath(":8080")).toBe("/dashboard");
  });

  it("rejects control characters that URL parsers strip", () => {
    expect(safeRedirectPath("/\t/evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("/\n/evil.com")).toBe("/dashboard");
  });

  it("uses a custom fallback", () => {
    expect(safeRedirectPath("//evil.com", "/auth/update-password")).toBe("/auth/update-password");
  });
});
