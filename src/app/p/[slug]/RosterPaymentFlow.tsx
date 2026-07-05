"use client";

import { useActionState, useState } from "react";
import { submitMockPayment, type PaymentState } from "./actions";
import { formatOre } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { inputClass } from "@/lib/ui";

type Member = { id: string; name: string; status: string };

const initial: PaymentState = { error: null, success: false };

function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

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

  const selectedMember = members.find((m) => m.id === selectedId) ?? null;

  if (state.success) {
    return (
      <div className="bg-success-light border border-success/30 rounded-lg shadow-card p-6 text-center flex flex-col gap-3">
        <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto">
          <IconCheck className="w-6 h-6 text-success" />
        </div>
        <div>
          <p className="font-semibold text-text-primary">Tack!</p>
          <p className="text-sm text-text-muted mt-1">
            Din betalning är rapporterad. Kassören kontrollerar mot Swish eller bank och bekräftar.
          </p>
        </div>
      </div>
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
                    {abbreviateName(m.name)}
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
      {selectedMember && (
        selectedMember.status !== "unpaid" ? (
          <Card className="p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-text-primary">
                {abbreviateName(selectedMember.name)}
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
                <span className="text-accent">{abbreviateName(selectedMember.name)}</span>
              </p>

              {state.error && (
                <p className="text-sm text-danger bg-danger-light border border-danger/20 rounded px-3 py-2">
                  {state.error}
                </p>
              )}

              <input type="hidden" name="collection_id" value={collectionId} />
              {/* amount is intentionally NOT submitted — the server reads it from
                  the DB (collections.amount), never the client. */}
              <input type="hidden" name="payer_name" value={selectedMember.name} />
              <input type="hidden" name="collection_member_id" value={selectedMember.id} />

              <Field label="E-postadress" optional>
                <input
                  name="payer_email"
                  type="email"
                  autoComplete="email"
                  placeholder="din@email.se"
                  className={inputClass}
                />
              </Field>

              <Button type="submit" variant="primary" disabled={isPending} className="w-full">
                {isPending ? "Registrerar…" : `Jag har betalat — ${formatOre(amount)}`}
              </Button>

              <p className="text-xs text-center text-text-muted">
                Lagkassan hanterar inga pengar. Betalningen sker via Swish eller bank.
              </p>
            </form>
          </div>
        )
      )}
    </div>
  );
}
