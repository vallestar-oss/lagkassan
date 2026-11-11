"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { submitMockPayment, type PaymentState } from "./actions";
import { formatOre } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FormError } from "@/components/ui/FormError";
import { IconCheck } from "@/components/icons";
import { NoMoneyNote, PaymentSuccess } from "./PaymentParts";
import { shortNames } from "@/lib/names";

type Member = { id: string; name: string; status: string };

const initial: PaymentState = { error: null, success: false };

export function RosterPaymentFlow({
  collectionId,
  amount,
  members,
}: {
  collectionId: string;
  amount: number;
  members: Member[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [state, action, isPending] = useActionState(submitMockPayment, initial);
  const panelRef = useRef<HTMLDivElement>(null);

  // Short public labels ("Anna L."), made unique within this list.
  const labels = useMemo(() => {
    const short = shortNames(members.map((m) => m.name));
    return new Map(members.map((m, i) => [m.id, short[i]]));
  }, [members]);
  const labelOf = (m: Member) => labels.get(m.id) ?? m.name;

  const selectedMember = members.find((m) => m.id === selectedId) ?? null;

  // The panel renders below the list — on a long list it would appear off
  // screen, so bring it into view when a name is picked.
  useEffect(() => {
    if (selectedId) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId]);

  if (state.success) {
    return (
      <PaymentSuccess message="Din betalning är rapporterad. Kassören kontrollerar mot Swish eller bank och bekräftar." />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Member list */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border bg-surface-alt/40">
          <p className="text-sm font-semibold text-text-primary">Välj ditt namn</p>
          <p className="text-xs text-text-muted mt-0.5">Din betalstatus visas först när du har valt ditt namn.</p>
        </div>
        <ul className="divide-y divide-surface-border">
          {members.map((m) => {
            const isSelected = m.id === selectedId;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(isSelected ? null : m.id)}
                  className={`w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors border-l-2 ${
                    isSelected
                      ? "bg-accent-light border-accent"
                      : "border-transparent hover:bg-surface-alt/60 cursor-pointer active:bg-surface-alt"
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? "text-accent" : "text-text-primary"
                    }`}
                  >
                    {labelOf(m)}
                  </span>
                  {isSelected && (
                    <IconCheck className="w-4 h-4 text-accent flex-shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Panel — appears when a name is selected */}
      <div ref={panelRef} className="scroll-mb-6">
        {selectedMember && (
          selectedMember.status !== "unpaid" ? (
            <Card className="p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-text-primary">
                  {labelOf(selectedMember)}
                </p>
                {selectedMember.status === "confirmed_paid" ? (
                  <Badge variant="success">Bekräftat av kassör</Badge>
                ) : (
                  <Badge variant="warning">Rapporterat betalt</Badge>
                )}
              </div>
              <p className="text-sm text-text-muted">
                {selectedMember.status === "confirmed_paid"
                  ? "Kassören har bekräftat betalningen. Klart!"
                  : "Betalningen är rapporterad — kassören kontrollerar mot Swish eller bank."}
              </p>
            </Card>
          ) : (
            <div className="bg-white border border-accent/30 rounded-lg shadow-card p-5">
              <form action={action} className="flex flex-col gap-4">
                <p className="text-sm font-semibold text-text-primary">
                  Bekräfta betalning för{" "}
                  <span className="text-accent">{labelOf(selectedMember)}</span>
                </p>

                <FormError message={state.error} />

                <input type="hidden" name="collection_id" value={collectionId} />
                {/* amount is intentionally NOT submitted — the server reads it from
                    the DB (collections.amount), never the client. */}
                <input type="hidden" name="collection_member_id" value={selectedMember.id} />

                <NoMoneyNote />

                <Button type="submit" variant="primary" disabled={isPending} className="w-full">
                  {isPending ? "Registrerar…" : `Jag har betalat — ${formatOre(amount)}`}
                </Button>

                <p className="text-xs text-center text-text-muted">
                  Kassören kontrollerar betalningen mot Swish eller bank.
                </p>
              </form>
            </div>
          )
        )}
      </div>
    </div>
  );
}
