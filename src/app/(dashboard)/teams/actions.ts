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

  if (!name) return { error: "Föreningens namn är obligatoriskt." };

  const teamId = crypto.randomUUID();

  const { error: teamError } = await supabase
    .from("teams")
    .insert({ id: teamId, name, description: description || null });

  if (teamError) return { error: teamError.message ?? "Kunde inte skapa förening." };

  const { error: memberError } = await supabase
    .from("team_members")
    .insert({ team_id: teamId, user_id: user.id, role: "owner" });

  if (memberError) return { error: memberError.message };

  // Bust the dashboard layout cache so the sidebar's "Mina lag" list shows
  // the new team immediately, without a manual browser refresh.
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
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

  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}`);
  return { error: null };
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

  if (error) return { error: error.message };

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
