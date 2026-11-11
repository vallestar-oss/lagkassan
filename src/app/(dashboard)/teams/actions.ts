"use server";

import { createClient } from "@/lib/supabase/server";
import { assertTeamRole } from "@/lib/auth";
import { parseNameList, splitNewNames } from "@/lib/names";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type TeamState = { error: string | null };

export async function createTeam(
  _prev: TeamState,
  formData: FormData,
): Promise<TeamState> {
  const supabase = await createClient();

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() ?? "";

  if (!name) return { error: "Lagets namn är obligatoriskt." };
  if (name.length > 100) return { error: "Lagets namn får vara högst 100 tecken." };
  if (description.length > 500) return { error: "Beskrivningen får vara högst 500 tecken." };

  // create_team checks the session itself (auth.uid()) and inserts the team
  // and the caller's owner row in one transaction (migration
  // 20261111000000_secure_team_creation), so a failure can never leave an
  // ownerless team behind. Direct inserts into teams/team_members are not
  // allowed for new teams.
  const { data: teamId, error } = await supabase.rpc("create_team", {
    p_name: name,
    p_description: description || null,
  });

  if (error || !teamId) return { error: "Kunde inte skapa laget. Försök igen." };

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

  const names = parseNameList((formData.get("names") as string | null) ?? "");

  if (names.length === 0)
    return { error: "Ange minst ett namn.", added: 0, skipped: [] };
  if (names.length > 500)
    return { error: "Max 500 namn per gång.", added: 0, skipped: [] };

  const { data: existing } = await supabase
    .from("roster_members")
    .select("name")
    .eq("team_id", teamId);

  const { toInsert, skipped } = splitNewNames(names, (existing ?? []).map((m) => m.name));

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

  // Scope by team too — the role check above only covers teamId.
  const { data: updated, error } = await supabase
    .from("roster_members")
    .update({ name: trimmed, phone: phone?.trim() || null })
    .eq("id", id)
    .eq("team_id", teamId)
    .select("id");

  if (error) return { error: "Kunde inte spara ändringen. Försök igen." };
  if (!updated?.length) return { error: "Personen hittades inte." };

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

  // Scope by team too — the role check above only covers teamId.
  const { error } = await supabase
    .from("roster_members")
    .delete()
    .eq("id", id)
    .eq("team_id", teamId);
  if (error) return { error: "Kunde inte ta bort personen. Försök igen." };

  revalidatePath(`/teams/${teamId}`);
  return { error: null };
}
