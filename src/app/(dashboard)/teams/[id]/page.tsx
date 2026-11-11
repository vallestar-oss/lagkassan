import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, requireUser } from "@/lib/supabase/server";
import { RosterManager } from "./RosterManager";
import { CollectionCard, type CollectionCardData } from "../../CollectionCard";
import { OnboardingSteps } from "../../OnboardingSteps";
import { EmptyCollections } from "../../EmptyCollections";
import { AutoRefresh } from "@/components/AutoRefresh";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { buttonClass } from "@/lib/ui";
import { fetchCollectionCounts } from "@/lib/collectionCounts";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await requireUser(supabase);

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

  const countsById = await fetchCollectionCounts(
    supabase,
    (rawCollections ?? []).map((c) => c.id),
  );

  const collections: CollectionCardData[] = (rawCollections ?? []).map((c) => {
    const counts = countsById[c.id] ?? { paid: 0, total: 0 };
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
          <EmptyCollections
            title="Inga förfrågningar för det här laget ännu"
            text="Skapa en förfrågan och dela länken — medlemmarna betalar utanför Lagkassan."
            href={`/collections/new?team=${team.id}`}
            cta="Skapa första förfrågan →"
          />
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
