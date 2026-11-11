import { describe, expect, it } from "vitest";
import { translateAuthError } from "./authErrors";

describe("translateAuthError", () => {
  it("translates known Supabase messages", () => {
    expect(translateAuthError("Invalid login credentials")).toBe("Fel e-postadress eller lösenord.");
    expect(translateAuthError("User already registered")).toBe(
      "Det finns redan ett konto med den e-postadressen.",
    );
  });

  it("reports the length Supabase actually requires", () => {
    expect(translateAuthError("Password should be at least 6 characters.")).toBe(
      "Lösenordet måste vara minst 6 tecken.",
    );
    expect(translateAuthError("Password should be at least 10 characters.")).toBe(
      "Lösenordet måste vara minst 10 tecken.",
    );
  });

  it("passes unknown messages through unchanged", () => {
    expect(translateAuthError("Something else")).toBe("Something else");
  });
});
