export const MIN_PASSWORD_LENGTH = 8;

/** Swedish translations for the most common Supabase auth errors. */
export function translateAuthError(message: string): string {
  if (message.includes("Invalid login credentials"))
    return "Fel e-postadress eller lösenord.";
  // Only reachable if email confirmation is switched on in Supabase Auth.
  if (message.includes("Email not confirmed"))
    return "Bekräfta din e-postadress innan du loggar in.";
  if (message.includes("User already registered"))
    return "Det finns redan ett konto med den e-postadressen.";
  const minLength = message.match(/Password should be at least (\d+)/);
  if (minLength)
    return `Lösenordet måste vara minst ${minLength[1]} tecken.`;
  if (message.includes("Unable to validate email"))
    return "Ogiltig e-postadress.";
  return message;
}
