"use client";

import { useActionState } from "react";
import { updatePaymentInstructions } from "../actions";

const initial = { error: null, saved: false };

export function EditInstructionsForm({
  collectionId,
  current,
}: {
  collectionId: string;
  current: string | null;
}) {
  const boundAction = updatePaymentInstructions.bind(null, collectionId);
  const [state, action, isPending] = useActionState(boundAction, initial);

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text-primary">Betalningsinstruktioner</span>
        <textarea
          name="payment_instructions"
          rows={4}
          defaultValue={current ?? ""}
          placeholder="Exempel: Swisha 850 kr till 070-xxx xx xx och skriv spelarens namn."
          className="border border-surface-border rounded-md px-3 py-2 text-sm bg-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors resize-none"
        />
        <p className="text-xs text-text-muted">
          Visas för medlemmen på betalningssidan. Lämna tomt för att ta bort.
        </p>
      </label>

      {state.error && (
        <p className="text-sm text-danger bg-danger-light border border-danger/20 rounded px-3 py-2">
          {state.error}
        </p>
      )}

      {state.saved && !state.error && (
        <p className="text-sm text-success">Instruktionerna har sparats.</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start text-sm font-medium px-4 py-2 rounded-md bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Sparar…" : "Spara instruktioner"}
      </button>
    </form>
  );
}
