import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RosterManager } from "./RosterManager";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: team } = await supabase
    .from("teams")
    .select("id, name, description")
    .eq("id", id)
    .single();

  if (!team) notFound();

  // Confirm membership and capture role (owner/treasurer may manage the roster).
  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", id)
    .eq("user_id", user.id)
    .single();

  if (!membership) notFound();

  const canManage = ["owner", "treasurer"].includes(membership.role);

  const { data: roster } = await supabase
    .from("roster_members")
    .select("id, name, phone")
    .eq("team_id", id)
    .order("name", { ascending: true });

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-text-primary mt-1">{team.name}</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Medlemmar i föreningen — namnen används som standard när du skapar en
          ny betalningsförfrågan.
        </p>
      </div>

      <RosterManager
        teamId={team.id}
        members={roster ?? []}
        canManage={canManage}
      />
    </div>
  );
}
