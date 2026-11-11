import { describe, expect, it } from "vitest";
import { escapeCsvCell } from "./csv";

describe("escapeCsvCell", () => {
  it("leaves plain text and numbers untouched", () => {
    expect(escapeCsvCell("Anna Lindqvist")).toBe("Anna Lindqvist");
    expect(escapeCsvCell(250)).toBe("250");
    expect(escapeCsvCell(-5)).toBe("-5");
  });

  it("quotes cells with delimiters, quotes and line breaks", () => {
    expect(escapeCsvCell("a;b")).toBe('"a;b"');
    expect(escapeCsvCell('säger "hej"')).toBe('"säger ""hej"""');
    expect(escapeCsvCell("rad1\nrad2")).toBe('"rad1\nrad2"');
    expect(escapeCsvCell("rad1\r\nrad2")).toBe('"rad1\r\nrad2"');
  });

  it("neutralizes formula triggers in text", () => {
    expect(escapeCsvCell("=1+1")).toBe("'=1+1");
    expect(escapeCsvCell("+46701234567")).toBe("'+46701234567");
    expect(escapeCsvCell("-2+3")).toBe("'-2+3");
    expect(escapeCsvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(escapeCsvCell("\t=1+1")).toBe("'\t=1+1");
  });

  it("neutralizes and quotes a formula that also contains delimiters", () => {
    expect(escapeCsvCell('=HYPERLINK("http://evil.example";"klicka")')).toBe(
      '"\'=HYPERLINK(""http://evil.example"";""klicka"")"',
    );
  });

  it("does not touch a trigger character in the middle of text", () => {
    expect(escapeCsvCell("a=b")).toBe("a=b");
    expect(escapeCsvCell("anna@example.com")).toBe("anna@example.com");
  });
});
