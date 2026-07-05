import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RosterManager } from "./RosterManager";
import { CollectionCard, type CollectionCardData } from "../../CollectionCard";
import { OnboardingSteps } from "../../OnboardingSteps";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { buttonClass } from "@/lib/ui";

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

  // This team's collections only — never mixed with other teams.
  const { data: rawCollections } = await supabase
    .from("collections")
    .select("id, title, amount, deadline, status, slug, group_label")
    .eq("team_id", id)
    .order("created_at", { ascending: false });

  const collectionIds = (rawCollections ?? []).map((c) => c.id);

  const [{ data: payments }, { data: memberRows }] = await Promise.all([
    collectionIds.length
      ? supabase.from("payments").select("collection_id, status").in("collection_id", collectionIds)
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
    if (m.status !== "unpaid") memberMap[m.collection_id].paid++;
  }

  const collections: CollectionCardData[] = (rawCollections ?? []).map((c) => {
    const counts = memberMap[c.id]?.total ? memberMap[c.id] : (paymentMap[c.id] ?? { paid: 0, total: 0 });
    return {
      id: c.id,
      title: c.title,
      amount: c.amount,
      deadline: c.deadline,
      status: c.status,
      group_label: c.group_label,
      paid_count: counts.paid,
      total_count: counts.total,
    };
  });

  const activeCollections = collections.filter((c) => c.status === "active");
  const closedCollections = collections.filter((c) => c.status !== "active");

  const hasMembers = (roster ?? []).length > 0;
  const hasCollections = collections.length > 0;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader
        backHref="/dashboard"
        backLabel="← Översikt"
        title={team.name}
        subtitle={
          <a href="#medlemmar" className="text-accent hover:underline">
            Hantera medlemmar
          </a>
        }
        action={
          <Link href={`/collections/new?team=${team.id}`} className={buttonClass("primary")}>
            + Ny förfrågan
          </Link>
        }
      />

      {/* Onboarding — guide the organizer to the next step */}
      {canManage && !hasMembers && (
        <div className="flex flex-col gap-4">
          <OnboardingSteps current={2} />
          <div className="bg-accent-light border border-accent/20 rounded-lg p-4 flex flex-col gap-1">
            <p className="text-sm font-semibold text-text-primary">Lägg till medlemmar</p>
            <p className="text-sm text-text-muted">
              Lägg till namnen på dem som ska betala. Namnen används sedan när du skapar en betalningsförfrågan för laget.{" "}
              <a href="#medlemmar" className="text-accent hover:underline font-medium">
                Lägg till nu ↓
              </a>
            </p>
          </div>
        </div>
      )}
      {canManage && hasMembers && !hasCollections && (
        <OnboardingSteps current={3} />
      )}

      {/* Insamlingar — this team's collections only */}
      <section>
        <SectionLabel className="mb-3">Insamlingar</SectionLabel>

        {collections.length === 0 ? (
          <div className="border border-surface-border border-dashed rounded-lg bg-white p-10 flex flex-col items-center text-center gap-3">
            <p className="font-semibold text-text-primary">
              Inga insamlingar för det här laget ännu
            </p>
            <Link
              href={`/collections/new?team=${team.id}`}
              className="text-sm font-medium text-accent hover:underline"
            >
              Skapa första förfrågan →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {activeCollections.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-text-muted">Aktiva ({activeCollections.length})</p>
                {activeCollections.map((c) => (
                  <CollectionCard key={c.id} collection={c} />
                ))}
              </div>
            )}
            {closedCollections.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-text-muted">Avslutade ({closedCollections.length})</p>
                {closedCollections.map((c) => (
                  <CollectionCard key={c.id} collection={c} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Medlemmar */}
      <div id="medlemmar" className="flex flex-col gap-3 scroll-mt-6">
        <SectionLabel>Medlemmar</SectionLabel>
        <RosterManager
          teamId={team.id}
          members={roster ?? []}
          canManage={canManage}
        />
      </div>
    </div>
  );
}
