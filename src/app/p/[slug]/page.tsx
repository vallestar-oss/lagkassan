import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatOre, formatSwedishDate } from "@/lib/utils";
import { PaymentForm } from "./PaymentForm";

export default async function PublicPaymentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: collection } = await supabase
    .from("collections")
    .select("*, teams(name)")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!collection) notFound();

  const { data: payments } = await supabase
    .from("payments")
    .select("payer_name, status")
    .eq("collection_id", collection.id)
    .eq("status", "paid");

  const paidCount = payments?.length ?? 0;
  const teamName = (collection.teams as { name: string } | null)?.name ?? "";

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
          {paidCount > 0 && (
            <p className="text-xs text-text-muted mt-3">
              {paidCount} {paidCount === 1 ? "person har" : "personer har"} redan betalt.
            </p>
          )}
        </div>

        {/* Payment form */}
        <PaymentForm
          collectionId={collection.id}
          amount={collection.amount}
        />

        <p className="text-xs text-text-muted text-center">
          Betalar du via Lagkassan delar vi din e-postadress med kassören för kvitto.
          Inga kortuppgifter sparas av oss.
        </p>
      </main>
    </div>
  );
}
