"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

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
  const ip = await getClientIp();
  const { ok } = rateLimit(`signup:${ip}`, 5, 60 * 60_000);
  if (!ok) return { error: "För många kontoförsök från din anslutning. Försök igen om en stund." };

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
  // Defense-in-depth on top of Supabase Auth's own rate limiting — caps
  // brute-force login attempts per IP regardless of which email is tried.
  const ip = await getClientIp();
  const { ok } = rateLimit(`signin:${ip}`, 10, 5 * 60_000);
  if (!ok) return { error: "För många inloggningsförsök. Vänta några minuter och försök igen." };

  const supabase = await createClient();

  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: translateError(error.message) };

  // Honor the redirect param set by middleware.
  const redirectTo = (formData.get("redirect") as string | null) ?? "/dashboard";
  redirect(redirectTo.startsWith("/") ? redirectTo : "/dashboard");
}

export type GuestState = { error: string | null };

// Lets visitors (e.g. recruiters browsing the portfolio) try the app
// instantly without creating an account — a real, brand-new Supabase
// anonymous auth user (no email/password), starting with zero teams so it
// goes through the normal onboarding just like any new signup.
export async function signInAsGuest(
  _prev: GuestState,
  formData: FormData,
): Promise<GuestState> {
  const ip = await getClientIp();
  const { ok } = rateLimit(`guest-signin:${ip}`, 20, 60 * 60_000);
  if (!ok) return { error: "För många försök. Försök igen om en stund." };

  const fullName = (formData.get("guest_name") as string | null)?.trim() || "Gäst";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInAnonymously({
    options: { data: { full_name: fullName } },
  });

  if (error) return { error: "Kunde inte starta testkontot. Försök igen." };

  redirect("/dashboard");
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
  const email = (formData.get("email") as string | null)?.trim() ?? "";

  // Rate limit by IP AND by the target email, so someone can't email-bomb
  // one specific address, nor loop through many addresses from one
  // connection. Always return { submitted: true } regardless — the anti-
  // enumeration property (never reveal if an account exists) must hold for
  // "rate limited" too, so this stays silent rather than surfacing an error.
  const ip = await getClientIp();
  const ipCheck = rateLimit(`reset-ip:${ip}`, 5, 15 * 60_000);
  const emailCheck = email ? rateLimit(`reset-email:${email.toLowerCase()}`, 3, 15 * 60_000) : { ok: true };

  if (email && ipCheck.ok && emailCheck.ok) {
    const supabase = await createClient();
    // `||` (not `??`) intentionally — an accidentally empty-string env var
    // must also fall back, not just an unset one.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/update-password`,
    });
  }

  return { submitted: true };
}
