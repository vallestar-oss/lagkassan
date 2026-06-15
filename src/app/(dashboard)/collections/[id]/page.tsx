import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatOre, formatSwedishDate } from "@/lib/utils";
import { markPaid, markMemberPaid, setCollectionStatus } from "../actions";
import { CopyButton } from "./CopyButton";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: collection } = await supabase
    .from("collections")
    .select("*, teams(name)")
    .eq("id", id)
    .single();

  if (!collection) notFound();

  // Verify this user belongs to the team.
  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", collection.team_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) notFound();

  // Load roster members — if any exist, they are the source of truth for stats.
  // .returns<> is needed because the generated types predate the status column.
  const { data: memberRows } = await supabase
    .from("collection_members")
    .select("id, name, status")
    .eq("collection_id", id)
    .order("name", { ascending: true })
    .returns<{ id: string; name: string; status: string }[]>();

  const rosterMembers = memberRows ?? [];
  const hasRoster = rosterMembers.length > 0;

  // Only load payments when there's no roster (free-form collections).
  const paymentList = hasRoster
    ? []
    : (
        await supabase
          .from("payments")
          .select("*")
          .eq("collection_id", id)
          .order("created_at", { ascending: false })
      ).data ?? [];

  const paidCount = hasRoster
    ? rosterMembers.filter((m) => m.status === "paid").length
    : paymentList.filter((p) => p.status === "paid").length;

  const totalCount = hasRoster ? rosterMembers.length : paymentList.length;

  const paidAmount = hasRoster
    ? paidCount * collection.amount
    : paymentList
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + p.amount, 0);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const shareUrl = `${appUrl}/p/${collection.slug}`;
  const canEdit = ["owner", "treasurer"].includes(membership.role);
  const teamName = (collection.teams as { name: string } | null)?.name ?? "";

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard" className="text-sm text-text-muted hover:text-text-primary transition-colors">
              ← Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">{collection.title}</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {teamName}
            {collection.deadline && (
              <> · Sista dag: {formatSwedishDate(collection.deadline)}</>
            )}
          </p>
        </div>
        {canEdit && (
          <form
            action={async () => {
              "use server";
              await setCollectionStatus(
                id,
                collection.status === "active" ? "closed" : "active",
              );
            }}
          >
            <button
              type="submit"
              className={`text-xs font-medium px-3 py-1.5 rounded border transition-colors whitespace-nowrap ${
                collection.status === "active"
                  ? "border-surface-border text-text-muted hover:border-danger hover:text-danger"
                  : "border-success/30 text-success bg-success-light hover:bg-success-light"
              }`}
            >
              {collection.status === "active" ? "Stäng förfrågan" : "Öppna igen"}
            </button>
          </form>
        )}
      </div>

      {/* Share URL */}
      <div className="bg-accent-light border border-accent/20 rounded-lg p-4">
        <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">
          Delningslänk
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm text-text-primary bg-white border border-surface-border rounded px-3 py-2 font-mono truncate">
            {shareUrl}
          </code>
          <CopyButton text={shareUrl} />
        </div>
        <p className="text-xs text-text-muted mt-2">
          Dela länken med dina medlemmar — de behöver inget konto för att betala.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Betalningar", value: `${paidCount} / ${totalCount}` },
          { label: "Insamlat", value: formatOre(paidAmount) },
          { label: "Belopp/person", value: formatOre(collection.amount) },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-surface-border rounded-lg p-4 shadow-card"
          >
            <p className="text-xs text-text-muted">{s.label}</p>
            <p className="text-lg font-bold text-text-primary font-mono mt-0.5">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Member / payment list */}
      <div className="bg-white border border-surface-border rounded-lg shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-surface-border flex items-center justify-between">
          <p className="text-sm font-semibold text-text-primary">
            {hasRoster ? "Deltagare" : "Betalningar"}
          </p>
          <span className="text-xs text-text-muted">
            {collection.status === "active" ? "Aktiv" : "Stängd"}
          </span>
        </div>

        {hasRoster ? (
          /* Roster-based: one row per expected payer */
          rosterMembers.length === 0 ? null : (
            <ul className="divide-y divide-surface-border">
              {rosterMembers.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between px-5 py-3 gap-3"
                >
                  <p className="text-sm font-medium text-text-primary flex-1 min-w-0 truncate">
                    {member.name}
                  </p>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-sm text-text-muted">
                      {formatOre(collection.amount)}
                    </span>
                    {member.status === "paid" ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-success-light text-success">
                        Betald
                      </span>
                    ) : canEdit ? (
                      <form
                        action={async () => {
                          "use server";
                          await markMemberPaid(member.id, member.name, id);
                        }}
                      >
                        <button
                          type="submit"
                          className="text-xs font-medium px-2 py-0.5 rounded border border-surface-border text-text-muted hover:border-success hover:text-success transition-colors"
                        >
                          Markera betald
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-surface-alt text-text-muted">
                        Väntar
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : /* Free-form: show individual payment rows */
        paymentList.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-text-muted">
              Inga betalningar än. Dela länken ovan för att komma igång.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-surface-border">
            {paymentList.map((payment) => (
              <li
                key={payment.id}
                className="flex items-center justify-between px-5 py-3 gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {payment.payer_name}
                  </p>
                  {payment.payer_email && (
                    <p className="text-xs text-text-muted truncate">
                      {payment.payer_email}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-mono text-sm text-text-muted">
                    {formatOre(payment.amount)}
                  </span>
                  {payment.status === "paid" ? (
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-success-light text-success">
                      Betald
                    </span>
                  ) : canEdit ? (
                    <form
                      action={async () => {
                        "use server";
                        await markPaid(payment.id, id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs font-medium px-2 py-0.5 rounded border border-surface-border text-text-muted hover:border-success hover:text-success transition-colors"
                      >
                        Markera betald
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-surface-alt text-text-muted">
                      Väntar
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
