import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RosterManager } from "./RosterManager";
import { CollectionCard, type CollectionCardData } from "../../CollectionCard";
import { OnboardingSteps } from "../../OnboardingSteps";
import { AutoRefresh } from "@/components/AutoRefresh";
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

  // First-time flow: an organizer who hasn't added members yet gets the
  // roster form front-and-center — not a "scroll down" link — because people
  // click the first prominent thing on the page, not the thing they had to
  // read about. The collections section (with its own big CTA) is pushed
  // below and quieted down so it doesn't compete for the first click.
  const showMembersFirst = canManage && !hasMembers;

  const membersSection = (
    <div id="medlemmar" className="flex flex-col gap-3 scroll-mt-6">
      <SectionLabel>Medlemmar</SectionLabel>
      <RosterManager teamId={team.id} members={roster ?? []} canManage={canManage} />
    </div>
  );

  const collectionsSection = (
    <section>
      <SectionLabel className="mb-3">Förfrågningar</SectionLabel>

      {collections.length === 0 ? (
        showMembersFirst ? (
          <p className="text-sm text-text-muted">
            Lägg till medlemmar ovan innan du skapar din första förfrågan.
          </p>
        ) : (
          <div className="border border-surface-border border-dashed rounded-lg bg-surface-alt/40 p-12 flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-text-primary">Inga förfrågningar för det här laget ännu</p>
              <p className="text-sm text-text-muted mt-1 max-w-xs">
                Skapa en förfrågan och dela länken — medlemmarna betalar utanför Lagkassan.
              </p>
            </div>
            <Link href={`/collections/new?team=${team.id}`} className={buttonClass("primary")}>
              Skapa första förfrågan →
            </Link>
          </div>
        )
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
  );

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <AutoRefresh />
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

      {showMembersFirst ? (
        <>
          <OnboardingSteps current={2} />
          <div className="bg-accent-light border border-accent/20 rounded-lg p-4 flex flex-col gap-1">
            <p className="text-sm font-semibold text-text-primary">Steg 1: Lägg till medlemmar</p>
            <p className="text-sm text-text-muted">
              Lägg till namnen på dem som ska betala nedan. Namnen används sedan när du skapar en betalningsförfrågan för laget.
            </p>
          </div>
          {membersSection}
          {collectionsSection}
        </>
      ) : (
        <>
          {canManage && hasMembers && !hasCollections && <OnboardingSteps current={3} />}
          {collectionsSection}
          {membersSection}
        </>
      )}
    </div>
  );
}
