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
  { key: "unpaid",        label: "Ej betalda" },
  { key: "reported_paid", label: "Rapporterat betalt" },
  { key: "confirmed_paid",label: "Bekräftat av kassör" },
];

// Shared classes so every badge/button on this list stays visually consistent.
const badgeBase = "text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap";
const badgeUnpaid = `${badgeBase} bg-surface-alt text-text-muted border-surface-border`;
const badgeReported = `${badgeBase} bg-amber-50 text-amber-700 border-amber-200`;
const badgeConfirmed = `${badgeBase} bg-success-light text-success border-success/20`;
const btnBase = "text-xs font-medium px-2.5 py-1 rounded border border-surface-border text-text-muted transition-colors whitespace-nowrap";
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

  const counts: Record<FilterKey, number> = {
    all:           members.length,
    unpaid:        members.filter((m) => m.status === "unpaid").length,
    reported_paid: members.filter((m) => m.status === "reported_paid").length,
    confirmed_paid:members.filter((m) => m.status === "confirmed_paid").length,
  };

  const filtered = filter === "all" ? members : members.filter((m) => m.status === filter);

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
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
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
          <p className="text-sm text-text-muted">Inga deltagare i den här filtreringen.</p>
        </div>
      ) : (
        <ul className="divide-y divide-surface-border">
          {filtered.map((member) => (
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
                        <form action={async () => { await revertAction(member.id, collectionId); }}>
                          <button type="submit" className={btnDanger}>
                            Ångra
                          </button>
                        </form>
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
                  </div>

                ) : member.status === "reported_paid" ? (
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className={badgeReported}>Rapporterat betalt</span>
                      {canEdit && (
                        <>
                          <form action={async () => { await confirmAction(member.id, collectionId); }}>
                            <button type="submit" className={btnSuccess}>
                              Bekräfta
                            </button>
                          </form>
                          <form action={async () => { await revertAction(member.id, collectionId); }}>
                            <button type="submit" className={btnDanger}>
                              Ångra
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                    {member.reported_at && (
                      <p className="text-xs text-text-muted">
                        Rapporterat: {formatSwedishDateTime(member.reported_at)}
                      </p>
                    )}
                  </div>

                ) : canEdit ? (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span className={badgeUnpaid}>Ej betald</span>
                    <form action={async () => { await markPaidAction(member.id, member.name, collectionId); }}>
                      <button type="submit" className={btnSuccess}>
                        Markera betald
                      </button>
                    </form>
                    {collectionStatus === "active" && (
                      <form action={async () => { await removeAction(member.id, collectionId); }}>
                        <button
                          type="submit"
                          className={btnDanger}
                          aria-label={`Ta bort ${member.name}`}
                        >
                          Ta bort
                        </button>
                      </form>
                    )}
                  </div>

                ) : (
                  <span className={badgeUnpaid}>Ej betald</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
