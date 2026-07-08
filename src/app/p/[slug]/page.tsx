import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatOre, formatSwedishDate } from "@/lib/utils";
import { PaymentForm } from "./PaymentForm";
import { RosterPaymentFlow } from "./RosterPaymentFlow";
import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/ui/SectionLabel";

export default async function PublicPaymentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // The anon role has NO direct table access (see migration
  // 20260707000000_lock_down_anon_access). The public page reads exactly one
  // collection + its roster through two SECURITY DEFINER functions scoped by
  // slug / id, so no other association's data is ever enumerable. The function
  // also joins teams, returning the association name in the same round-trip.
  const { data: collectionRows } = await supabase.rpc("get_public_collection", {
    p_slug: slug,
  });
  const collection = collectionRows?.[0];

  if (!collection) notFound();

  const { data: memberRows } = await supabase.rpc(
    "get_public_collection_members",
    { p_collection_id: collection.id },
  );

  const teamName = collection.team_name ?? "";
  const members = memberRows ?? [];
  const hasRoster = members.length > 0;

  // Only used in the free-form fallback header ("N har redan betalt").
  const paidCount = hasRoster
    ? members.filter((m) => m.status !== "unpaid").length
    : Number(collection.paid_count ?? 0);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="border-b border-surface-border bg-shell/60">
        <div className="max-w-lg mx-auto px-6 h-16 flex items-center">
          <span className="font-bold text-text-primary tracking-tight">Lagkassan</span>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-10 flex flex-col gap-6">
        {/* Collection info */}
        <Card className="p-6">
          <SectionLabel className="mb-1.5">
            {teamName}
            {collection.group_label && (
              <span className="ml-2 normal-case font-medium text-text-muted">· {collection.group_label}</span>
            )}
          </SectionLabel>
          <h1 className="text-display leading-tight font-bold text-text-primary">{collection.title}</h1>
          {collection.description && (
            <p className="text-sm text-text-muted mt-1.5">{collection.description}</p>
          )}
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-surface-border">
            <div>
              <p className="text-xs text-text-muted">Belopp</p>
              <p className="text-2xl font-bold font-mono text-text-primary mt-0.5">
                {formatOre(collection.amount)}
              </p>
            </div>
            {collection.deadline && (
              <div className="ml-auto text-right">
                <p className="text-xs text-text-muted">Sista betalningsdag</p>
                <p className="text-sm font-medium text-text-primary mt-0.5">
                  {formatSwedishDate(collection.deadline)}
                </p>
              </div>
            )}
          </div>
          {!hasRoster && paidCount > 0 && (
            <p className="text-xs text-text-muted mt-3">
              {paidCount} {paidCount === 1 ? "person har" : "personer har"} redan betalt.
            </p>
          )}
        </Card>

        {/* Så fungerar det — explicit steps so members never think Lagkassan takes the payment */}
        <Card className="p-5">
          <SectionLabel className="mb-3">Så fungerar det</SectionLabel>
          <ol className="flex flex-col gap-2.5">
            {[
              "Läs vad förfrågan gäller ovan — belopp och sista betalningsdag.",
              "Betala externt enligt instruktionerna nedan, via Swish eller bank.",
              "Välj ditt eget namn i listan.",
              "Markera dig som betald. Lagkassan sparar bara statusen — inga pengar går via Lagkassan.",
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-accent-light text-accent text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-text-primary">{text}</span>
              </li>
            ))}
          </ol>
        </Card>

        {/* Payment instructions — shown when the organizer has set them */}
        {collection.payment_instructions ? (
          <Card className="p-6 flex flex-col gap-2">
            <SectionLabel>Betalningsinstruktioner</SectionLabel>
            <p className="text-sm text-text-primary whitespace-pre-wrap">
              {collection.payment_instructions}
            </p>
            <p className="text-xs text-text-muted mt-1">
              Följ instruktionerna ovan och markera sedan att du har betalat.
            </p>
          </Card>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-xs text-amber-800 leading-relaxed">
              Kassören har inte lagt in betalningsinstruktioner ännu. Kontakta kassören för information om hur du betalar innan du markerar din betalning här.
            </p>
          </div>
        )}

        {/* Payment: roster flow (member list) or free-form fallback */}
        {hasRoster ? (
          <RosterPaymentFlow
            collectionId={collection.id}
            amount={collection.amount}
            members={members}
          />
        ) : (
          <PaymentForm
            collectionId={collection.id}
            amount={collection.amount}
            hasInstructions={!!collection.payment_instructions}
          />
        )}
      </main>
    </div>
  );
}
