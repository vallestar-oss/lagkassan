import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CollectionCard } from "../CollectionCard";
import { EmptyCollections } from "../EmptyCollections";
import { AutoRefresh } from "@/components/AutoRefresh";
import { IconPlus } from "@/components/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { buttonClass } from "@/lib/ui";
import { fetchCollectionCounts } from "@/lib/collectionCounts";

async function getPageData(): Promise<{
  profile: { full_name: string | null } | null;
  teams: { id: string; name: string }[];
  collections: {
    id: string; title: string; amount: number; deadline: string | null;
    status: string; slug: string; paid_count: number; total_count: number;
    team_name: string; group_label: string | null;
  }[];
} | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, membershipsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("team_members")
      .select("team_id, role, teams(id, name)")
      .eq("user_id", user.id),
  ]);

  const teams = (membershipsRes.data ?? [])
    .map((m) => m.teams as { id: string; name: string } | null)
    .filter((t): t is { id: string; name: string } => t !== null);

  if (!teams.length) return { profile: profileRes.data, teams: [], collections: [] };

  const teamIds = teams.map((t) => t.id);
  const { data: rawCollections } = await supabase
    .from("collections")
    .select("id, title, amount, deadline, status, slug, group_label, team_id, teams(name)")
    .in("team_id", teamIds)
    .order("created_at", { ascending: false });

  const countsById = await fetchCollectionCounts(
    supabase,
    (rawCollections ?? []).map((c) => c.id),
  );

  const collections = (rawCollections ?? []).map((c) => {
    const counts = countsById[c.id] ?? { paid: 0, total: 0 };
    return {
      id: c.id,
      title: c.title,
      amount: c.amount,
      deadline: c.deadline,
      status: c.status,
      slug: c.slug,
      team_name: (c.teams as { name: string } | null)?.name ?? "",
      group_label: c.group_label,
      paid_count: counts.paid,
      total_count: counts.total,
    };
  });

  return { profile: profileRes.data, teams, collections };
}

export default async function DashboardPage() {
  const data = await getPageData();

  // No Supabase — dev fallback
  if (!data) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-text-primary">Välkommen!</h1>
        <p className="text-text-muted text-sm">
          Konfigurera <code className="font-mono text-xs bg-surface-alt px-1 rounded">.env.local</code> med Supabase-nycklarna för att komma igång.
        </p>
      </div>
    );
  }

  // Has Supabase but no teams → onboarding
  if (!data.teams.length) {
    redirect("/teams/new");
  }

  const firstName = data.profile?.full_name?.split(" ")[0] ?? "där";
  const activeCollections = data.collections.filter((c) => c.status === "active");
  const closedCollections = data.collections.filter((c) => c.status !== "active");

  return (
    <div className="flex flex-col gap-8">
      <AutoRefresh />
      {/* Header */}
      <PageHeader
        eyebrow="Global översikt"
        title={`Välkommen, ${firstName}!`}
        subtitle={
          <>
            {data.teams.map((t, i) => (
              <span key={t.id}>
                {i > 0 && " · "}
                <Link
                  href={`/teams/${t.id}`}
                  className="hover:text-accent hover:underline transition-colors"
                >
                  {t.name}
                </Link>
              </span>
            ))}
            <span className="text-text-muted"> · </span>
            <Link
              href={`/teams/${data.teams[0].id}`}
              className="text-accent hover:underline"
            >
              Hantera medlemmar
            </Link>
          </>
        }
        action={
          <Link href="/collections/new" className={buttonClass("primary", "md", "flex-shrink-0")}>
            <IconPlus />
            Ny förfrågan
          </Link>
        }
      />

      {/* Active collections */}
      {activeCollections.length > 0 && (
        <section>
          <SectionLabel className="mb-3">Aktiva ({activeCollections.length})</SectionLabel>
          <div className="flex flex-col gap-3">
            {activeCollections.map((c) => (
              <CollectionCard key={c.id} collection={c} showTeamName />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {data.collections.length === 0 && (
        <EmptyCollections
          title="Inga betalningsförfrågningar än"
          text="Skapa din första förfrågan och dela länken med medlemmarna."
          href="/collections/new"
          cta="Skapa din första förfrågan →"
        />
      )}

      {/* Closed collections */}
      {closedCollections.length > 0 && (
        <section>
          <SectionLabel className="mb-3">Avslutade ({closedCollections.length})</SectionLabel>
          <div className="flex flex-col gap-3">
            {closedCollections.map((c) => (
              <CollectionCard key={c.id} collection={c} showTeamName />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
