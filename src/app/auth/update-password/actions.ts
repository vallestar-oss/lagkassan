"use server";

import { createClient } from "@/lib/supabase/server";
import { MIN_PASSWORD_LENGTH } from "@/lib/authErrors";

export type UpdatePasswordState = { error: string | null; success: boolean };

export async function updatePassword(
  _prev: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const supabase = await createClient();

  // A valid session must already exist — established by /auth/confirm via
  // the emailed recovery link. If it doesn't, the link was invalid/expired.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user)
    return { error: "Länken är ogiltig eller har gått ut. Begär en ny återställningslänk.", success: false };

  const password = (formData.get("password") as string | null) ?? "";
  const confirmPassword = (formData.get("confirm_password") as string | null) ?? "";

  if (password.length < MIN_PASSWORD_LENGTH)
    return { error: `Lösenordet måste vara minst ${MIN_PASSWORD_LENGTH} tecken.`, success: false };
  if (password !== confirmPassword)
    return { error: "Lösenorden matchar inte.", success: false };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Kunde inte uppdatera lösenordet. Försök igen.", success: false };

  return { error: null, success: true };
}
