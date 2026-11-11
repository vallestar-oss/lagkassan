import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createClient, requireUser } from "@/lib/supabase/server";
import { formatOre, formatSwedishDate, isPastDeadline } from "@/lib/utils";
import {
  markMemberPaid,
  setCollectionStatus,
  removeCollectionMember,
  confirmMemberPayment,
  revertMemberPayment,
} from "../actions";
import { AddMembersForm } from "./AddMembersForm";
import { EditInstructionsForm } from "./EditInstructionsForm";
import { MemberList } from "./MemberList";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ShareSection } from "./ShareSection";
import { CloseCollectionButton } from "./CloseCollectionButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { BadgeVariant } from "@/lib/ui";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await requireUser(supabase);

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

  const { data: memberRows } = await supabase
    .from("collection_members")
    .select("id, name, status, reported_at, confirmed_at")
    .eq("collection_id", id)
    .order("name", { ascending: true });

  const members = memberRows ?? [];

  // "Reported" = the member has said they paid; "confirmed" = the treasurer
  // has checked it externally. Every member owes the same amount.
  const totalCount     = members.length;
  const unpaidCount    = members.filter((m) => m.status === "unpaid").length;
  const reportedCount  = members.filter((m) => m.status === "reported_paid").length;
  const confirmedCount = members.filter((m) => m.status === "confirmed_paid").length;

  const totalAmount     = totalCount * collection.amount;
  const reportedAmount  = (reportedCount + confirmedCount) * collection.amount;
  const confirmedAmount = confirmedCount * collection.amount;
  const remainingAmount = totalAmount - confirmedAmount;

  // `||` (not `??`) intentionally — an accidentally empty-string env var must
  // also fall back, not just an unset one. Without this, a misconfigured
  // deploy silently turns the share link/QR code into a broken relative path.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const shareUrl = `${appUrl}/p/${collection.slug}`;
  const canEdit = ["owner", "treasurer"].includes(membership.role);
  const teamName = (collection.teams as { name: string } | null)?.name ?? "";

  // Generated server-side (pure JS, no canvas) so the client ships zero extra
  // QR code JS — just an <img> with a data: URL.
  const qrDataUrl = await QRCode.toDataURL(shareUrl, { margin: 1, width: 240 });

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <AutoRefresh />
      {/* Header */}
      <PageHeader
        backHref="/dashboard"
        backLabel="← Dashboard"
        title={collection.title}
        subtitle={
          <>
            {teamName}
            {collection.group_label && (
              <> · <span className="text-text-primary font-medium">{collection.group_label}</span></>
            )}
            {collection.deadline && (
              <> · Sista dag: {formatSwedishDate(collection.deadline)}</>
            )}
          </>
        }
        action={
          canEdit ? (
            <CloseCollectionButton
              collectionId={id}
              isActive={collection.status === "active"}
              collectionTitle={collection.title}
              action={setCollectionStatus}
            />
          ) : undefined
        }
      />

      {/* Share section — visible to every team member */}
      <ShareSection
        shareUrl={shareUrl}
        qrDataUrl={qrDataUrl}
        collectionTitle={collection.title}
        teamName={teamName}
        amountLabel={formatOre(collection.amount)}
      />

      {/* Status summary */}
      <div className="flex flex-wrap gap-2">
        {([
          { label: "Totalt",      value: totalCount,     variant: "neutral" },
          { label: "Ej betalda",  value: unpaidCount,    variant: "neutral" },
          { label: "Rapporterat", value: reportedCount,  variant: unpaidCount === 0 && reportedCount === 0 ? "neutral" : "warning" },
          { label: "Bekräftat",   value: confirmedCount, variant: confirmedCount === 0 ? "neutral" : "success" },
        ] as { label: string; value: number; variant: BadgeVariant }[]).map((s) => (
          <Badge key={s.label} variant={s.variant} className="shadow-sm">
            <span className="text-text-muted font-normal">{s.label}</span>
            <span className="font-bold tabular-nums">{s.value}</span>
          </Badge>
        ))}
      </div>

      {/* Amount stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Förväntat totalt" value={formatOre(totalAmount)} />
        <StatCard label="Rapporterat betalt" value={formatOre(reportedAmount)} />
        <StatCard label="Bekräftat av kassör" value={formatOre(confirmedAmount)} />
        <StatCard label="Kvar att bekräfta" value={formatOre(remainingAmount)} />
      </div>

      {/* Deadline passed while still collecting — nudge the treasurer */}
      {collection.status === "active" && collection.deadline && isPastDeadline(collection.deadline) && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 leading-relaxed">
          Sista betalningsdagen ({formatSwedishDate(collection.deadline)}) har passerat.
          {unpaidCount > 0 && ` ${unpaidCount} har inte betalat än.`}
          {canEdit && " Stäng förfrågan när du är klar, så slutar länken ta emot betalningar."}
        </p>
      )}

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

      <MemberList
        members={members}
        collectionId={id}
        collectionTitle={collection.title}
        collectionAmount={collection.amount}
        collectionStatus={collection.status}
        canEdit={canEdit}
        confirmAction={confirmMemberPayment}
        revertAction={revertMemberPayment}
        markPaidAction={markMemberPaid}
        removeAction={removeCollectionMember}
      />

      {/* Add participants — only for active collections the user can edit */}
      {canEdit && collection.status === "active" && <AddMembersForm collectionId={id} />}

      {/* Edit payment instructions — owner/treasurer, active collections only */}
      {canEdit && collection.status === "active" && (
        <Card className="p-5 flex flex-col gap-4">
          <SectionLabel>Redigera betalningsinstruktioner</SectionLabel>
          <EditInstructionsForm
            collectionId={id}
            current={collection.payment_instructions ?? null}
          />
        </Card>
      )}
    </div>
  );
}
