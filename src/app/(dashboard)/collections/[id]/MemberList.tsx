"use client";

import { useState } from "react";
import { formatOre, formatSwedishDateTime, toFilename } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { inputClass, cardClass, cn } from "@/lib/ui";

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

const STATUS_LABELS: Record<string, string> = {
  unpaid: "Ej betald",
  reported_paid: "Rapporterat betalt",
  confirmed_paid: "Bekräftat av kassör",
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
  confirmAction: (memberId: string, collectionId: string) => Promise<{ error: string | null }>;
  revertAction:  (memberId: string, collectionId: string) => Promise<{ error: string | null }>;
  markPaidAction: (memberId: string, memberName: string, collectionId: string) => Promise<{ error: string | null }>;
  removeAction:  (memberId: string, collectionId: string) => Promise<{ error: string | null }>;
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

  async function runAction(key: string, fn: () => Promise<{ error: string | null }>) {
    setPendingKey(key);
    setRowError(null);
    const res = await fn();
    setPendingKey(null);
    if (res.error) setRowError({ key, message: res.error });
  }

  function confirmRevert(member: Member): boolean {
    if (member.status === "reported_paid") {
      return window.confirm(
        `Återställ ${member.name} till obetald? Den rapporterade betalningen tas bort och personen kan rapportera på nytt.`,
      );
    }
    return window.confirm(`Ångra bekräftelsen för ${member.name}? Personen visas som rapporterat betalt igen.`);
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
              STATUS_LABELS[m.status] ?? m.status,
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
            const confirmKey = `${member.id}:confirm`;
            const revertKey = `${member.id}:revert`;
            const markPaidKey = `${member.id}:markPaid`;
            const removeKey = `${member.id}:remove`;

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

                  {member.status === "confirmed_paid" ? (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Badge variant="success">Bekräftat av kassör</Badge>
                        {canEdit && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="chip"
                            disabled={pendingKey === revertKey}
                            onClick={() => {
                              if (!confirmRevert(member)) return;
                              runAction(revertKey, () => revertAction(member.id, collectionId));
                            }}
                          >
                            {pendingKey === revertKey ? "…" : "Ångra"}
                          </Button>
                        )}
                      </div>
                      {member.confirmed_at && (
                        <p className="text-xs text-text-muted">
                          Bekräftat: {formatSwedishDateTime(member.confirmed_at)}
                        </p>
                      )}
                      {member.reported_at && (
                        <p className="text-xs text-text-muted">
                          Rapporterat: {formatSwedishDateTime(member.reported_at)}
                        </p>
                      )}
                      {rowError?.key === revertKey && (
                        <p className="text-xs text-danger">{rowError.message}</p>
                      )}
                    </div>

                  ) : member.status === "reported_paid" ? (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Badge variant="warning">Rapporterat betalt</Badge>
                        {canEdit && (
                          <>
                            <Button
                              type="button"
                              variant="success"
                              size="chip"
                              disabled={pendingKey === confirmKey}
                              onClick={() => runAction(confirmKey, () => confirmAction(member.id, collectionId))}
                            >
                              {pendingKey === confirmKey ? "…" : "Bekräfta"}
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="chip"
                              disabled={pendingKey === revertKey}
                              onClick={() => {
                                if (!confirmRevert(member)) return;
                                runAction(revertKey, () => revertAction(member.id, collectionId));
                              }}
                            >
                              {pendingKey === revertKey ? "…" : "Ångra"}
                            </Button>
                          </>
                        )}
                      </div>
                      {member.reported_at && (
                        <p className="text-xs text-text-muted">
                          Rapporterat: {formatSwedishDateTime(member.reported_at)}
                        </p>
                      )}
                      {(rowError?.key === confirmKey || rowError?.key === revertKey) && (
                        <p className="text-xs text-danger">{rowError.message}</p>
                      )}
                    </div>

                  ) : canEdit ? (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Badge variant="neutral">Ej betald</Badge>
                        <Button
                          type="button"
                          variant="success"
                          size="chip"
                          disabled={pendingKey === markPaidKey}
                          onClick={() => runAction(markPaidKey, () => markPaidAction(member.id, member.name, collectionId))}
                        >
                          {pendingKey === markPaidKey ? "…" : "Markera betald"}
                        </Button>
                        {collectionStatus === "active" && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="chip"
                            disabled={pendingKey === removeKey}
                            onClick={() => {
                              if (!window.confirm(`Ta bort ${member.name} från förfrågan?`)) return;
                              runAction(removeKey, () => removeAction(member.id, collectionId));
                            }}
                            aria-label={`Ta bort ${member.name}`}
                          >
                            {pendingKey === removeKey ? "…" : "Ta bort"}
                          </Button>
                        )}
                      </div>
                      {(rowError?.key === markPaidKey || rowError?.key === removeKey) && (
                        <p className="text-xs text-danger">{rowError.message}</p>
                      )}
                    </div>

                  ) : (
                    <Badge variant="neutral">Ej betald</Badge>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
