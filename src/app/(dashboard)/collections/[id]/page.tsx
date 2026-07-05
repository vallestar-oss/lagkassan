import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatOre, formatSwedishDate } from "@/lib/utils";
import {
  markPaid,
  markMemberPaid,
  setCollectionStatus,
  removeCollectionMember,
  confirmMemberPayment,
  revertMemberPayment,
} from "../actions";
import { CopyButton } from "./CopyButton";
import { AddMembersForm } from "./AddMembersForm";
import { EditInstructionsForm } from "./EditInstructionsForm";
import { MemberList } from "./MemberList";
import { AutoRefresh } from "./AutoRefresh";
import { RemindersSection } from "./RemindersSection";

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
    .select("id, name, status, reported_at, confirmed_at")
    .eq("collection_id", id)
    .order("name", { ascending: true })
    .returns<{ id: string; name: string; status: string; reported_at: string | null; confirmed_at: string | null }[]>();

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

  // "Reported" = anyone who has said they paid, whether or not the treasurer
  // has confirmed it yet. "Confirmed" = the treasurer has checked it externally.
  const totalCount     = hasRoster ? rosterMembers.length : paymentList.length;
  const unpaidCount    = hasRoster ? rosterMembers.filter((m) => m.status === "unpaid").length        : 0;
  const reportedCount  = hasRoster ? rosterMembers.filter((m) => m.status === "reported_paid").length : paymentList.filter((p) => p.status === "paid").length;
  const confirmedCount = hasRoster ? rosterMembers.filter((m) => m.status === "confirmed_paid").length : reportedCount;

  const totalAmount     = totalCount * collection.amount;
  const reportedAmount  = hasRoster
    ? (reportedCount + confirmedCount) * collection.amount
    : reportedCount * collection.amount;
  const confirmedAmount = hasRoster
    ? confirmedCount * collection.amount
    : paymentList.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = totalAmount - confirmedAmount;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const shareUrl = `${appUrl}/p/${collection.slug}`;
  const canEdit = ["owner", "treasurer"].includes(membership.role);
  const teamName = (collection.teams as { name: string } | null)?.name ?? "";

  const deadlineLine = collection.deadline
    ? ` Sista betalningsdag: ${formatSwedishDate(collection.deadline)}.`
    : "";

  const reminderText = `Hej! Påminnelse om betalning för ${collection.title} (${formatOre(collection.amount)}).${deadlineLine} Betala via Swish eller bank enligt betalningsinstruktionerna, öppna sedan länken, välj ditt eget namn och markera att du har betalat: ${shareUrl}`;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <AutoRefresh />
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
            {collection.group_label && (
              <> · <span className="text-text-primary font-medium">{collection.group_label}</span></>
            )}
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
          Dela länken med dina medlemmar — de behöver inget konto för att följa instruktionerna och markera betalning.
        </p>
      </div>

      {/* Status summary */}
      {hasRoster && (
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Totalt",    value: totalCount,     cls: "bg-surface-alt text-text-muted border-surface-border" },
            { label: "Ej betalda", value: unpaidCount,   cls: "bg-surface-alt text-text-muted border-surface-border" },
            { label: "Rapporterat", value: reportedCount, cls: unpaidCount === 0 && reportedCount === 0 ? "bg-surface-alt text-text-muted border-surface-border" : "bg-amber-50 text-amber-700 border-amber-200" },
            { label: "Bekräftat",  value: confirmedCount, cls: confirmedCount === 0 ? "bg-surface-alt text-text-muted border-surface-border" : "bg-success-light text-success border-success/20" },
          ].map((s) => (
            <div key={s.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${s.cls}`}>
              <span className="text-text-muted font-normal">{s.label}:</span>
              <span className="font-bold tabular-nums">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Amount stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Förväntat totalt",    value: formatOre(totalAmount) },
          { label: "Rapporterat betalt",  value: formatOre(reportedAmount) },
          { label: "Bekräftat av kassör", value: formatOre(confirmedAmount) },
          { label: "Kvar att bekräfta",   value: formatOre(remainingAmount) },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-surface-border rounded-lg p-4 shadow-card">
            <p className="text-xs text-text-muted">{s.label}</p>
            <p className="text-base font-bold text-text-primary font-mono mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pilot disclaimer */}
      <div className="flex items-start gap-2 bg-surface-alt border border-surface-border rounded-lg px-4 py-3">
        <svg className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
        <p className="text-xs text-text-muted leading-relaxed">
          Lagkassan hanterar inte betalningar. Kontrollera rapporterade betalningar mot Swish eller bank innan du bekräftar.
        </p>
      </div>

      {/* Missing payment instructions warning — active collections only */}
      {collection.status === "active" && !collection.payment_instructions && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <p className="text-xs text-amber-800 leading-relaxed">
            Du har inte angett betalningsinstruktioner än. Medlemmarna vet då inte hur de ska betala.{" "}
            {canEdit && "Lägg till instruktioner nedan."}
          </p>
        </div>
      )}

      {/* Share helper — organizer-only, roster-based collections only */}
      {canEdit && hasRoster && (
        <RemindersSection shareUrl={shareUrl} unpaidCount={unpaidCount} reminderText={reminderText} />
      )}

      {/* Member / payment list */}
      {hasRoster ? (
        <MemberList
          members={rosterMembers}
          collectionId={id}
          collectionAmount={collection.amount}
          collectionStatus={collection.status}
          canEdit={canEdit}
          confirmAction={confirmMemberPayment}
          revertAction={revertMemberPayment}
          markPaidAction={markMemberPaid}
          removeAction={removeCollectionMember}
        />
      ) : (
        /* Free-form: show individual payment rows */
        <div className="bg-white border border-surface-border rounded-lg shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-surface-border flex items-center justify-between">
            <p className="text-sm font-semibold text-text-primary">Rapporterade betalningar</p>
            <span className="text-xs text-text-muted">
              {collection.status === "active" ? "Aktiv" : "Stängd"}
            </span>
          </div>
          {paymentList.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-text-muted">
                Inga betalningar än. Dela länken ovan för att komma igång.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-surface-border">
              {paymentList.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between px-5 py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{payment.payer_name}</p>
                    {payment.payer_email && (
                      <p className="text-xs text-text-muted truncate">{payment.payer_email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-sm text-text-muted">{formatOre(payment.amount)}</span>
                    {payment.status === "paid" ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-success-light text-success">
                        Betald
                      </span>
                    ) : canEdit ? (
                      <form action={async () => { "use server"; await markPaid(payment.id, id); }}>
                        <button type="submit" className="text-xs font-medium px-2 py-0.5 rounded border border-surface-border text-text-muted hover:border-success hover:text-success transition-colors">
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
      )}
      {/* Add participants — only for active collections the user can edit */}
      {canEdit && collection.status === "active" && (
        <AddMembersForm
          collectionId={id}
          isFreeForm={!hasRoster}
        />
      )}

      {/* Edit payment instructions — owner/treasurer, active collections only */}
      {canEdit && collection.status === "active" && (
        <div className="bg-white border border-surface-border rounded-lg p-5 shadow-card flex flex-col gap-4">
          <p className="text-sm font-semibold text-text-primary">Redigera betalningsinstruktioner</p>
          <EditInstructionsForm
            collectionId={id}
            current={collection.payment_instructions ?? null}
          />
        </div>
      )}
    </div>
  );
}
