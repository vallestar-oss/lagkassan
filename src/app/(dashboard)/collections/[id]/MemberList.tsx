"use client";

import { useState } from "react";
import { formatOre, formatSwedishDateTime, toFilename } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { inputClass, cardClass, cn, type BadgeVariant } from "@/lib/ui";

type Member = {
  id: string;
  name: string;
  status: string;
  reported_at: string | null;
  confirmed_at: string | null;
};

type FilterKey = "all" | "unpaid" | "reported_paid" | "confirmed_paid";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",           label: "Alla" },
  { key: "unpaid",        label: "Ej betalat" },
  { key: "reported_paid", label: "Rapporterat betalt" },
  { key: "confirmed_paid",label: "Bekräftat betalt" },
];

const STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  unpaid: { label: "Ej betald", variant: "neutral" },
  reported_paid: { label: "Rapporterat betalt", variant: "warning" },
  confirmed_paid: { label: "Bekräftat av kassör", variant: "success" },
};

type ActionResult = Promise<{ error: string | null }>;

type RowAction = {
  key: string;
  label: string;
  variant: "success" | "destructive";
  run: () => ActionResult;
  confirmText?: string;
  ariaLabel?: string;
};

export function MemberList({
  members,
  collectionId,
  collectionTitle,
  collectionAmount,
  collectionStatus,
  canEdit,
  confirmAction,
  revertAction,
  markPaidAction,
  removeAction,
}: {
  members: Member[];
  collectionId: string;
  collectionTitle: string;
  collectionAmount: number;
  collectionStatus: string;
  canEdit: boolean;
  confirmAction: (memberId: string, collectionId: string) => ActionResult;
  revertAction: (memberId: string, collectionId: string) => ActionResult;
  markPaidAction: (memberId: string, memberName: string, collectionId: string) => ActionResult;
  removeAction: (memberId: string, collectionId: string) => ActionResult;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  // Tracks which single "member:action" pair is in flight so only that row's
  // button disables/shows a loading label — prevents double-submits without
  // freezing the whole list.
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ key: string; message: string } | null>(null);

  const counts: Record<FilterKey, number> = {
    all:           members.length,
    unpaid:        members.filter((m) => m.status === "unpaid").length,
    reported_paid: members.filter((m) => m.status === "reported_paid").length,
    confirmed_paid:members.filter((m) => m.status === "confirmed_paid").length,
  };

  const byStatus = filter === "all" ? members : members.filter((m) => m.status === filter);
  const query = search.trim().toLowerCase();
  const filtered = query
    ? byStatus.filter((m) => m.name.toLowerCase().includes(query))
    : byStatus;

  async function runAction({ key, run, confirmText }: RowAction) {
    if (confirmText && !window.confirm(confirmText)) return;
    setPendingKey(key);
    setRowError(null);
    const res = await run();
    setPendingKey(null);
    if (res.error) setRowError({ key, message: res.error });
  }

  // The buttons a treasurer gets for a member, by payment status.
  function actionsFor(member: Member): RowAction[] {
    if (!canEdit) return [];

    const revert: RowAction = {
      key: `${member.id}:revert`,
      label: "Ångra",
      variant: "destructive",
      run: () => revertAction(member.id, collectionId),
      confirmText:
        member.status === "reported_paid"
          ? `Återställ ${member.name} till obetald? Den rapporterade betalningen tas bort och personen kan rapportera på nytt.`
          : `Ångra bekräftelsen för ${member.name}? Personen visas som rapporterat betalt igen.`,
    };

    if (member.status === "confirmed_paid") return [revert];

    if (member.status === "reported_paid") {
      return [
        {
          key: `${member.id}:confirm`,
          label: "Bekräfta",
          variant: "success",
          run: () => confirmAction(member.id, collectionId),
        },
        revert,
      ];
    }

    const actions: RowAction[] = [
      {
        key: `${member.id}:markPaid`,
        label: "Markera betald",
        variant: "success",
        run: () => markPaidAction(member.id, member.name, collectionId),
      },
    ];
    if (collectionStatus === "active") {
      actions.push({
        key: `${member.id}:remove`,
        label: "Ta bort",
        variant: "destructive",
        run: () => removeAction(member.id, collectionId),
        confirmText: `Ta bort ${member.name} från förfrågan?`,
        ariaLabel: `Ta bort ${member.name}`,
      });
    }
    return actions;
  }

  return (
    <div className={cn(cardClass, "overflow-hidden")}>
      {/* Header + filters */}
      <div className="px-5 py-4 border-b border-surface-border flex flex-col gap-3 bg-surface-alt/40">
        <div className="flex items-center justify-between">
          <SectionLabel>Deltagare</SectionLabel>
          <Badge variant={collectionStatus === "active" ? "success" : "neutral"}>
            {collectionStatus === "active" ? "Aktiv" : "Stängd"}
          </Badge>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök på namn…"
          className={inputClass}
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`text-xs font-medium px-3 min-h-10 inline-flex items-center rounded-full border transition-colors ${
                filter === key
                  ? "bg-accent text-white border-accent"
                  : "border-surface-border text-text-muted hover:border-accent/50 hover:text-text-primary"
              }`}
            >
              {label}
              <span className={`ml-1.5 tabular-nums ${filter === key ? "opacity-80" : "opacity-60"}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <ExportCsvButton
            filename={`${toFilename(collectionTitle)}-deltagare.csv`}
            headers={["Namn", "Belopp (kr)", "Status", "Rapporterat", "Bekräftat"]}
            rows={members.map((m) => [
              m.name,
              collectionAmount / 100,
              STATUS[m.status]?.label ?? m.status,
              m.reported_at ? formatSwedishDateTime(m.reported_at) : "",
              m.confirmed_at ? formatSwedishDateTime(m.confirmed_at) : "",
            ])}
            label="Exportera till Excel/CSV"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-text-muted">
            {query ? "Ingen deltagare matchar sökningen." : "Inga deltagare i den här filtreringen."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-surface-border">
          {filtered.map((member) => {
            const status = STATUS[member.status] ?? STATUS.unpaid;
            const actions = actionsFor(member);
            const error = rowError?.key.startsWith(`${member.id}:`) ? rowError.message : null;

            return (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between px-5 py-3.5 gap-x-3 gap-y-2 hover:bg-surface-alt/40 transition-colors"
              >
                <p className="text-sm font-medium text-text-primary flex-1 min-w-0 truncate">
                  {member.name}
                </p>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-mono text-sm text-text-muted">
                    {formatOre(collectionAmount)}
                  </span>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      {actions.map((a) => (
                        <Button
                          key={a.key}
                          type="button"
                          variant={a.variant}
                          size="chip"
                          disabled={pendingKey === a.key}
                          onClick={() => runAction(a)}
                          aria-label={a.ariaLabel}
                        >
                          {pendingKey === a.key ? "…" : a.label}
                        </Button>
                      ))}
                    </div>
                    {member.status === "confirmed_paid" && member.confirmed_at && (
                      <p className="text-xs text-text-muted">
                        Bekräftat: {formatSwedishDateTime(member.confirmed_at)}
                      </p>
                    )}
                    {member.status !== "unpaid" && member.reported_at && (
                      <p className="text-xs text-text-muted">
                        Rapporterat: {formatSwedishDateTime(member.reported_at)}
                      </p>
                    )}
                    {error && <p className="text-xs text-danger">{error}</p>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
