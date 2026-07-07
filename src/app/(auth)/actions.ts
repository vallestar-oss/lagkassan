"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthState = { error: string | null };

// Swedish translations for the most common Supabase auth errors.
function translateError(message: string): string {
  if (message.includes("Invalid login credentials"))
    return "Fel e-postadress eller lösenord.";
  if (message.includes("Email not confirmed"))
    return "Bekräfta din e-postadress innan du loggar in.";
  if (message.includes("User already registered"))
    return "Det finns redan ett konto med den e-postadressen.";
  if (message.includes("Password should be at least"))
    return "Lösenordet måste vara minst 8 tecken.";
  if (message.includes("Unable to validate email"))
    return "Ogiltig e-postadress.";
  return message;
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const fullName = (formData.get("full_name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) return { error: translateError(error.message) };

  redirect("/dashboard");
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: translateError(error.message) };

  // Honor the redirect param set by middleware.
  const redirectTo = (formData.get("redirect") as string | null) ?? "/dashboard";
  redirect(redirectTo.startsWith("/") ? redirectTo : "/dashboard");
}

export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type ForgotPasswordState = { submitted: boolean };

// Always returns submitted:true regardless of outcome — never reveal whether
// an account exists for a given email (the errors resetPasswordForEmail can
// return, e.g. "user not found", would otherwise leak that information).
export async function requestPasswordReset(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const supabase = await createClient();
  const email = (formData.get("email") as string | null)?.trim() ?? "";

  if (email) {
    // `||` (not `??`) intentionally — an accidentally empty-string env var
    // must also fall back, not just an unset one.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/update-password`,
    });
  }

  return { submitted: true };
}
