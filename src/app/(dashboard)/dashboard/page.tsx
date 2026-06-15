import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatOre, formatSwedishDate } from "@/lib/utils";

function IconPlus() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

async function getPageData(): Promise<{
  profile: { full_name: string | null } | null;
  teams: { id: string; name: string }[];
  collections: {
    id: string; title: string; amount: number; deadline: string | null;
    status: string; slug: string; paid_count: number; total_count: number;
    team_name: string;
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
    .select("id, title, amount, deadline, status, slug, team_id, teams(name)")
    .in("team_id", teamIds)
    .order("created_at", { ascending: false });

  const collectionIds = (rawCollections ?? []).map((c) => c.id);

  const [{ data: payments }, { data: memberRows }] = await Promise.all([
    collectionIds.length
      ? supabase
          .from("payments")
          .select("collection_id, status")
          .in("collection_id", collectionIds)
      : { data: [] },
    collectionIds.length
      ? supabase
          .from("collection_members")
          .select("collection_id, status")
          .in("collection_id", collectionIds)
          .returns<{ collection_id: string; status: string }[]>()
      : { data: [] as { collection_id: string; status: string }[] },
  ]);

  const paymentMap: Record<string, { paid: number; total: number }> = {};
  for (const p of payments ?? []) {
    if (!paymentMap[p.collection_id]) paymentMap[p.collection_id] = { paid: 0, total: 0 };
    paymentMap[p.collection_id].total++;
    if (p.status === "paid") paymentMap[p.collection_id].paid++;
  }

  const memberMap: Record<string, { paid: number; total: number }> = {};
  for (const m of memberRows ?? []) {
    if (!memberMap[m.collection_id]) memberMap[m.collection_id] = { paid: 0, total: 0 };
    memberMap[m.collection_id].total++;
    if (m.status === "paid") memberMap[m.collection_id].paid++;
  }

  const collections = (rawCollections ?? []).map((c) => {
    // Prefer collection_members counts for rostered collections.
    const counts = memberMap[c.id]?.total ? memberMap[c.id] : (paymentMap[c.id] ?? { paid: 0, total: 0 });
    return {
      id: c.id,
      title: c.title,
      amount: c.amount,
      deadline: c.deadline,
      status: c.status,
      slug: c.slug,
      team_name: (c.teams as { name: string } | null)?.name ?? "",
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Välkommen, {firstName}!
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
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
          </p>
        </div>
        <Link
          href="/collections/new"
          className="flex items-center gap-2 bg-accent text-white text-sm font-semibold px-4 py-2.5 rounded-md hover:bg-accent-hover transition-colors"
        >
          <IconPlus />
          Ny förfrågan
        </Link>
      </div>

      {/* Active collections */}
      {activeCollections.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Aktiva ({activeCollections.length})
          </p>
          <div className="flex flex-col gap-3">
            {activeCollections.map((c) => (
              <CollectionCard key={c.id} collection={c} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {data.collections.length === 0 && (
        <div className="border border-surface-border border-dashed rounded-lg bg-white p-12 flex flex-col items-center text-center gap-4">
          <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
          </svg>
          <div>
            <p className="font-semibold text-text-primary">Inga betalningsförfrågningar än</p>
            <p className="text-sm text-text-muted mt-1 max-w-xs">
              Skapa din första förfrågan och dela länken med medlemmarna.
            </p>
          </div>
          <Link href="/collections/new" className="text-sm font-medium text-accent hover:underline">
            Skapa din första förfrågan →
          </Link>
        </div>
      )}

      {/* Closed collections */}
      {closedCollections.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Avslutade ({closedCollections.length})
          </p>
          <div className="flex flex-col gap-3">
            {closedCollections.map((c) => (
              <CollectionCard key={c.id} collection={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CollectionCard({
  collection,
}: {
  collection: {
    id: string; title: string; amount: number; deadline: string | null;
    status: string; paid_count: number; total_count: number; team_name: string;
  };
}) {
  const pct =
    collection.total_count > 0
      ? Math.round((collection.paid_count / collection.total_count) * 100)
      : 0;

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="bg-white border border-surface-border rounded-lg px-5 py-4 shadow-card flex items-center justify-between gap-4 hover:border-accent/40 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
          {collection.title}
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          {formatOre(collection.amount)}
          {collection.deadline && (
            <> · {formatSwedishDate(collection.deadline)}</>
          )}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold font-mono text-text-primary">
          {collection.paid_count}/{collection.total_count}
        </p>
        <p className="text-xs text-text-muted">{pct}% betalt</p>
      </div>
    </Link>
  );
}
