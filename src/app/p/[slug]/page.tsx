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

        {/* Så fungerar det — explicit steps so members never think Lagkassan takes the payment */}
        <div className="bg-white border border-surface-border rounded-lg p-5 shadow-card">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Så fungerar det
          </p>
          <ol className="flex flex-col gap-2.5">
            {[
              "Läs vad insamlingen gäller ovan — belopp och sista betalningsdag.",
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
        </div>

        {/* Payment instructions — shown when the organizer has set them */}
        {collection.payment_instructions ? (
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

        <p className="text-xs text-text-muted text-center">
          Lagkassan hanterar inga pengar. Betalningar sker via Swish eller bank.
        </p>
      </main>
    </div>
  );
}
