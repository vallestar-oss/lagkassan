"use client";

import { useActionState } from "react";
import { submitMockPayment, type PaymentState } from "./actions";
import { formatOre } from "@/lib/utils";

const initial: PaymentState = { error: null, success: false };

export function PaymentForm({
  collectionId,
  amount,
}: {
  collectionId: string;
  amount: number;
}) {
  const [state, action, isPending] = useActionState(submitMockPayment, initial);

  if (state.success) {
    return (
      <div className="bg-success-light border border-success/30 rounded-lg p-6 text-center flex flex-col gap-3">
        <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-text-primary">Simulerad betalning registrerad!</p>
          <p className="text-sm text-text-muted mt-1">
            Betalningen är markerad som genomförd i demoläget. Inga riktiga pengar har dragits.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="bg-white border border-surface-border rounded-lg p-6 shadow-card flex flex-col gap-5"
    >
      <p className="text-sm font-semibold text-text-primary">Din information</p>

      {state.error && (
        <p className="text-sm text-danger bg-danger-light border border-danger/20 rounded px-3 py-2">
          {state.error}
        </p>
      )}

      <input type="hidden" name="collection_id" value={collectionId} />
      {/* amount is intentionally NOT submitted — the server reads it from the
          DB (collections.amount), never the client. */}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text-primary">Ditt namn</span>
        <input
          name="payer_name"
          type="text"
          required
          autoFocus
          autoComplete="name"
          placeholder="Anna Lindqvist"
          className="border border-surface-border rounded-md px-3 py-2 text-sm bg-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text-primary">
          E-postadress{" "}
          <span className="text-text-muted font-normal">(valfritt)</span>
        </span>
        <input
          name="payer_email"
          type="email"
          autoComplete="email"
          placeholder="anna@exempel.se"
          className="border border-surface-border rounded-md px-3 py-2 text-sm bg-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-accent text-white font-semibold py-3 rounded-md hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Registrerar…" : `Markera som betald (demo) — ${formatOre(amount)}`}
      </button>

      <p className="text-xs text-center text-text-muted">
        Demoläge — inga pengar dras och inga kortuppgifter hanteras.
      </p>
    </form>
  );
}
