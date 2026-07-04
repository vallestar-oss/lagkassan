import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatOre, formatSwedishDate } from "@/lib/utils";
import { PaymentForm } from "./PaymentForm";
import { RosterPaymentFlow } from "./RosterPaymentFlow";

export default async function PublicPaymentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Anon users can read active collections, but NOT the teams join (RLS
  // requires team membership). Fetch collection without the join, then fetch
  // team name via the service-role admin client which bypasses RLS.
  const { data: collection } = await supabase
    .from("collections")
    .select("id, team_id, title, description, amount, deadline, payment_instructions, group_label")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!collection) notFound();

  const admin = createAdminClient();
  const [teamRes, memberRowsRes, paidCountRes] = await Promise.all([
    admin.from("teams").select("name").eq("id", collection.team_id).single(),

    // Load roster for this collection. The public RLS policy allows anon reads
    // for active collections — no auth needed.
    supabase
      .from("collection_members")
      .select("id, name, status")
      .eq("collection_id", collection.id)
      .order("name", { ascending: true })
      .returns<{ id: string; name: string; status: string }[]>(),

    supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("collection_id", collection.id)
      .eq("status", "paid"),
  ]);

  const teamName = teamRes.data?.name ?? "";
  const members = memberRowsRes.data ?? [];
  const hasRoster = members.length > 0;

  // Only used in the free-form fallback header ("N har redan betalt").
  const paidCount = hasRoster
    ? members.filter((m) => m.status !== "unpaid").length
    : paidCountRes.count ?? 0;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="border-b border-surface-border bg-white">
        <div className="max-w-lg mx-auto px-6 h-14 flex items-center">
          <span className="font-bold text-text-primary tracking-tight">Lagkassan</span>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-10 flex flex-col gap-6">
        {/* Collection info */}
        <div className="bg-white border border-surface-border rounded-lg p-6 shadow-card">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
            {teamName}
            {collection.group_label && (
              <span className="ml-2 normal-case font-medium text-text-muted">· {collection.group_label}</span>
            )}
          </p>
          <h1 className="text-xl font-bold text-text-primary">{collection.title}</h1>
          {collection.description && (
            <p className="text-sm text-text-muted mt-1">{collection.description}</p>
          )}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-surface-border">
            <div>
              <p className="text-xs text-text-muted">Belopp</p>
              <p className="text-2xl font-bold font-mono text-text-primary">
                {formatOre(collection.amount)}
              </p>
            </div>
            {collection.deadline && (
              <div className="ml-auto text-right">
                <p className="text-xs text-text-muted">Sista betalningsdag</p>
                <p className="text-sm font-medium text-text-primary">
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
        </div>

        {/* Pilot info banner */}
        <div className="bg-surface-alt border border-surface-border rounded-lg px-4 py-3 flex items-start gap-3">
          <svg className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <p className="text-xs text-text-muted leading-relaxed">
            Betalningen sker direkt till föreningen via Swish eller bank — inte via Lagkassan. Här rapporterar du bara att du har betalat.
          </p>
        </div>

        {/* Payment instructions — shown when the organizer has set them */}
        {collection.payment_instructions && (
          <div className="bg-white border border-surface-border rounded-lg p-6 shadow-card flex flex-col gap-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Betalningsinstruktioner
            </p>
            <p className="text-sm text-text-primary whitespace-pre-wrap">
              {collection.payment_instructions}
            </p>
            <p className="text-xs text-text-muted mt-1">
              Följ instruktionerna ovan och markera sedan att du har betalat.
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

        <p className="text-xs text-text-muted text-center">
          Lagkassan hanterar inga pengar. Betalningar sker via Swish eller bank.
        </p>
      </main>
    </div>
  );
}
