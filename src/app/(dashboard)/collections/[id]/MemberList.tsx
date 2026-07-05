"use client";

import { useState } from "react";
import { formatOre, formatSwedishDateTime } from "@/lib/utils";

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

// Shared classes so every badge/button on this list stays visually consistent.
// Buttons target a ~44px tap height for comfortable mobile use.
const badgeBase = "text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap";
const badgeUnpaid = `${badgeBase} bg-surface-alt text-text-muted border-surface-border`;
const badgeReported = `${badgeBase} bg-amber-50 text-amber-700 border-amber-200`;
const badgeConfirmed = `${badgeBase} bg-success-light text-success border-success/20`;
const btnBase = "text-xs font-medium px-3 min-h-11 inline-flex items-center justify-center rounded border border-surface-border text-text-muted transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed";
const btnSuccess = `${btnBase} hover:border-success hover:text-success`;
const btnDanger = `${btnBase} hover:border-danger hover:text-danger`;

export function MemberList({
  members,
  collectionId,
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
    <div className="bg-white border border-surface-border rounded-lg shadow-card overflow-hidden">
      {/* Header + filters */}
      <div className="px-5 py-3 border-b border-surface-border flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-text-primary">Deltagare</p>
          <span className="text-xs text-text-muted">
            {collectionStatus === "active" ? "Aktiv" : "Stängd"}
          </span>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök på namn…"
          className="w-full text-sm border border-surface-border rounded-md px-3 py-1.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-light focus:border-accent"
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
                className="flex flex-wrap items-center justify-between px-5 py-3 gap-x-3 gap-y-2"
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
                        <span className={badgeConfirmed}>Bekräftat av kassör</span>
                        {canEdit && (
                          <button
                            type="button"
                            disabled={pendingKey === revertKey}
                            onClick={() => {
                              if (!confirmRevert(member)) return;
                              runAction(revertKey, () => revertAction(member.id, collectionId));
                            }}
                            className={btnDanger}
                          >
                            {pendingKey === revertKey ? "…" : "Ångra"}
                          </button>
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
                        <span className={badgeReported}>Rapporterat betalt</span>
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              disabled={pendingKey === confirmKey}
                              onClick={() => runAction(confirmKey, () => confirmAction(member.id, collectionId))}
                              className={btnSuccess}
                            >
                              {pendingKey === confirmKey ? "…" : "Bekräfta"}
                            </button>
                            <button
                              type="button"
                              disabled={pendingKey === revertKey}
                              onClick={() => {
                                if (!confirmRevert(member)) return;
                                runAction(revertKey, () => revertAction(member.id, collectionId));
                              }}
                              className={btnDanger}
                            >
                              {pendingKey === revertKey ? "…" : "Ångra"}
                            </button>
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
                        <span className={badgeUnpaid}>Ej betald</span>
                        <button
                          type="button"
                          disabled={pendingKey === markPaidKey}
                          onClick={() => runAction(markPaidKey, () => markPaidAction(member.id, member.name, collectionId))}
                          className={btnSuccess}
                        >
                          {pendingKey === markPaidKey ? "…" : "Markera betald"}
                        </button>
                        {collectionStatus === "active" && (
                          <button
                            type="button"
                            disabled={pendingKey === removeKey}
                            onClick={() => {
                              if (!window.confirm(`Ta bort ${member.name} från insamlingen?`)) return;
                              runAction(removeKey, () => removeAction(member.id, collectionId));
                            }}
                            className={btnDanger}
                            aria-label={`Ta bort ${member.name}`}
                          >
                            {pendingKey === removeKey ? "…" : "Ta bort"}
                          </button>
                        )}
                      </div>
                      {(rowError?.key === markPaidKey || rowError?.key === removeKey) && (
                        <p className="text-xs text-danger">{rowError.message}</p>
                      )}
                    </div>

                  ) : (
                    <span className={badgeUnpaid}>Ej betald</span>
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
