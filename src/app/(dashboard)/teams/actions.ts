"use server";

import { createClient } from "@/lib/supabase/server";
import { assertTeamRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type TeamState = { error: string | null };

export async function createTeam(
  _prev: TeamState,
  formData: FormData,
): Promise<TeamState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inte inloggad." };

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() ?? "";

  if (!name) return { error: "Lagets namn är obligatoriskt." };

  const teamId = crypto.randomUUID();

  const { error: teamError } = await supabase
    .from("teams")
    .insert({ id: teamId, name, description: description || null });

  if (teamError) return { error: "Kunde inte skapa laget. Försök igen." };

  const { error: memberError } = await supabase
    .from("team_members")
    .insert({ team_id: teamId, user_id: user.id, role: "owner" });

  if (memberError) return { error: "Kunde inte skapa laget. Försök igen." };

  // Bust the dashboard layout cache so the sidebar's "Mina lag" list shows
  // the new team immediately, without a manual browser refresh.
  revalidatePath("/dashboard", "layout");
  // Land on the team page (not the dashboard) so the organizer is guided
  // straight into the next onboarding step — adding members.
  redirect(`/teams/${teamId}`);
}

// ─── Roster members ───────────────────────────────────────────────────────────
// The team-level list of people the treasurer tracks (players/parents).
// Owner/treasurer-only writes are enforced both by RLS and, as defense-in-depth,
// by an explicit assertTeamRole check in each action below.

export type RosterState = { error: string | null };

export async function addRosterMember(
  _prev: RosterState,
  formData: FormData,
): Promise<RosterState> {
  const supabase = await createClient();

  const teamId = (formData.get("team_id") as string | null) ?? "";

  const { error: authError } = await assertTeamRole(supabase, teamId, [
    "owner",
    "treasurer",
  ]);
  if (authError) return { error: authError };

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() || null;

  if (!name) return { error: "Namn är obligatoriskt." };

  const { error } = await supabase
    .from("roster_members")
    .insert({ team_id: teamId, name, phone });

  if (error) return { error: "Kunde inte lägga till personen. Försök igen." };

  revalidatePath(`/teams/${teamId}`);
  return { error: null };
}

export type BulkRosterState = { error: string | null; added: number; skipped: string[] };

// Paste a list of names (one per line) to add multiple roster members at
// once. Mirrors addCollectionMembers' dedupe logic: skips exact duplicates
// within the pasted list and names that already exist in the roster.
export async function addRosterMembersBulk(
  teamId: string,
  _prev: BulkRosterState,
  formData: FormData,
): Promise<BulkRosterState> {
  const supabase = await createClient();

  const { error: authError } = await assertTeamRole(supabase, teamId, [
    "owner",
    "treasurer",
  ]);
  if (authError) return { error: authError, added: 0, skipped: [] };

  const raw = (formData.get("names") as string | null) ?? "";
  const names = raw
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean)
    .map((n) => n.slice(0, 100)); // cap individual name length

  if (names.length === 0)
    return { error: "Ange minst ett namn.", added: 0, skipped: [] };
  if (names.length > 500)
    return { error: "Max 500 namn per gång.", added: 0, skipped: [] };

  // Fetch existing roster names for this team to deduplicate.
  const { data: existing } = await supabase
    .from("roster_members")
    .select("name")
    .eq("team_id", teamId);

  const existingLower = new Set(
    (existing ?? []).map((m) => m.name.trim().toLowerCase()),
  );

  const toInsert: string[] = [];
  const skipped: string[] = [];
  for (const name of names) {
    if (existingLower.has(name.toLowerCase())) {
      skipped.push(name);
    } else {
      toInsert.push(name);
      existingLower.add(name.toLowerCase()); // prevent duplicates within the same pasted list
    }
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("roster_members").insert(
      toInsert.map((name) => ({ team_id: teamId, name })),
    );
    if (error) return { error: "Kunde inte lägga till medlemmar. Försök igen.", added: 0, skipped: [] };
  }

  revalidatePath(`/teams/${teamId}`);
  return { error: null, added: toInsert.length, skipped };
}

export async function updateRosterMember(
  id: string,
  teamId: string,
  name: string,
  phone: string | null,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error: authError } = await assertTeamRole(supabase, teamId, [
    "owner",
    "treasurer",
  ]);
  if (authError) return { error: authError };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Namn är obligatoriskt." };

  const { error } = await supabase
    .from("roster_members")
    .update({ name: trimmed, phone: phone?.trim() || null })
    .eq("id", id);

  if (error) return { error: "Kunde inte spara ändringen. Försök igen." };

  revalidatePath(`/teams/${teamId}`);
  return { error: null };
}

export async function deleteRosterMember(
  id: string,
  teamId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error: authError } = await assertTeamRole(supabase, teamId, [
    "owner",
    "treasurer",
  ]);
  if (authError) return { error: authError };

  const { error } = await supabase.from("roster_members").delete().eq("id", id);
  if (error) return { error: "Kunde inte ta bort personen. Försök igen." };

  revalidatePath(`/teams/${teamId}`);
  return { error: null };
}
