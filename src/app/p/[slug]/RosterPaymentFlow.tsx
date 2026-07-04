"use client";

import { useActionState, useState } from "react";
import { submitMockPayment, type PaymentState } from "./actions";
import { formatOre } from "@/lib/utils";

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
  hasInstructions,
}: {
  collectionId: string;
  amount: number;
  members: Member[];
  hasInstructions?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [state, action, isPending] = useActionState(submitMockPayment, initial);

  const selectedMember = members.find((m) => m.id === selectedId) ?? null;

  if (state.success) {
    return (
      <div className="bg-success-light border border-success/30 rounded-lg p-6 text-center flex flex-col gap-3">
        <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto">
          <IconCheck className="w-6 h-6 text-success" />
        </div>
        <div>
          {hasInstructions ? (
            <>
              <p className="font-semibold text-text-primary">Tack!</p>
              <p className="text-sm text-text-muted mt-1">
                Din betalning har markerats som gjord. Kassören behöver fortfarande kontrollera betalningen.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-text-primary">Simulerad betalning registrerad!</p>
              <p className="text-sm text-text-muted mt-1">
                Betalningen är markerad som genomförd i demoläget. Inga riktiga pengar har dragits.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Member list */}
      <div className="bg-white border border-surface-border rounded-lg shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-surface-border">
          <p className="text-sm font-semibold text-text-primary">Välj ditt namn</p>
          <p className="text-xs text-text-muted mt-0.5">Tryck på ditt namn för att betala.</p>
        </div>
        <ul className="divide-y divide-surface-border">
          {members.map((m) => {
            const isSelected = m.id === selectedId;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(isSelected ? null : m.id)}
                  className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors ${
                    isSelected ? "bg-accent-light" : "hover:bg-surface cursor-pointer"
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
                    <span className="text-xs font-medium text-accent">Vald ↓</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Panel — appears when a name is selected */}
      {selectedMember && (
        selectedMember.status !== "unpaid" ? (
          <div className="bg-white border border-surface-border rounded-lg p-5 shadow-card flex flex-col gap-2">
            <p className="text-sm font-semibold text-text-primary">
              {abbreviateName(selectedMember.name)} har redan rapporterat betalning.
            </p>
            <p className="text-sm text-text-muted">
              Inget mer att göra — kassören kontrollerar och bekräftar betalningen.
            </p>
          </div>
        ) : (
          <form
            action={action}
            className="bg-white border border-accent/30 rounded-lg p-5 shadow-card flex flex-col gap-4"
          >
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

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-primary">
                E-postadress{" "}
                <span className="text-text-muted font-normal">(valfritt)</span>
              </span>
              <input
                name="payer_email"
                type="email"
                autoComplete="email"
                placeholder="din@email.se"
                className="border border-surface-border rounded-md px-3 py-2 text-sm bg-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors"
              />
            </label>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-accent text-white font-semibold py-3 rounded-md hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending
                ? "Registrerar…"
                : hasInstructions
                ? `Jag har betalat enligt instruktionerna — ${formatOre(amount)}`
                : `Markera som betald (demo) — ${formatOre(amount)}`}
            </button>

            <p className="text-xs text-center text-text-muted">
              {hasInstructions
                ? "Lagkassan hanterar inte betalningen — kassören kontrollerar manuellt."
                : "Demoläge — inga pengar dras och inga kortuppgifter hanteras."}
            </p>
          </form>
        )
      )}
    </div>
  );
}
