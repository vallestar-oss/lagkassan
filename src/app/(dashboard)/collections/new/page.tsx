import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CollectionForm } from "./CollectionForm";

export default async function NewCollectionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get the teams this user can create collections for (owner or treasurer).
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id, role, teams(id, name)")
    .eq("user_id", user.id)
    .in("role", ["owner", "treasurer"]);

  if (!memberships?.length) redirect("/teams/new");

  // Extract teams, filtering out any null joins.
  const teams = memberships
    .map((m) => m.teams as { id: string; name: string } | null)
    .filter((t): t is { id: string; name: string } => t !== null);

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">
          Ny betalningsförfrågan
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Skapa en länk du kan dela med dina medlemmar.
        </p>
      </div>
      <CollectionForm teams={teams} />
    </div>
  );
}
