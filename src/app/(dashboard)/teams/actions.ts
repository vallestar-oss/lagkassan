"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({ name, description: description || null })
    .select("id")
    .single();

  if (teamError || !team) return { error: teamError?.message ?? "Kunde inte skapa förening." };

  const { error: memberError } = await supabase
    .from("team_members")
    .insert({ team_id: team.id, user_id: user.id, role: "owner" });

  if (memberError) return { error: memberError.message };

  redirect("/dashboard");
}
