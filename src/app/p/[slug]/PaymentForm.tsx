"use client";

import { useActionState } from "react";
import { submitMockPayment, type PaymentState } from "./actions";
import { formatOre } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/lib/ui";

const initial: PaymentState = { error: null, success: false };

export function PaymentForm({
  collectionId,
  amount,
  hasInstructions,
}: {
  collectionId: string;
  amount: number;
  hasInstructions?: boolean;
}) {
  const [state, action, isPending] = useActionState(submitMockPayment, initial);

  if (state.success) {
    return (
      <div className="bg-success-light border border-success/30 rounded-lg shadow-card p-6 text-center flex flex-col gap-3">
        <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-text-primary">Tack!</p>
          <p className="text-sm text-text-muted mt-1">
            Din betalning har markerats som gjord. Kassören behöver fortfarande kontrollera betalningen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <form action={action} className="flex flex-col gap-5">
        <p className="text-sm font-semibold text-text-primary">Din information</p>

        {state.error && (
          <p className="text-sm text-danger bg-danger-light border border-danger/20 rounded px-3 py-2">
            {state.error}
          </p>
        )}

        <input type="hidden" name="collection_id" value={collectionId} />
        {/* amount is intentionally NOT submitted — the server reads it from the
            DB (collections.amount), never the client. */}

        <Field label="Ditt namn">
          <input
            name="payer_name"
            type="text"
            required
            autoFocus
            autoComplete="name"
            placeholder="Anna Lindqvist"
            className={inputClass}
          />
        </Field>

        <Field label="E-postadress" optional>
          <input
            name="payer_email"
            type="email"
            autoComplete="email"
            placeholder="anna@exempel.se"
            className={inputClass}
          />
        </Field>

        <div className="flex items-center gap-1.5 text-xs text-text-muted bg-surface-alt rounded-md px-3 py-2">
          <svg className="w-3.5 h-3.5 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <span>Inga kortuppgifter — Lagkassan hanterar inga pengar</span>
        </div>

        <Button type="submit" variant="primary" disabled={isPending} className="w-full">
          {isPending
            ? "Registrerar…"
            : hasInstructions
            ? `Jag har betalat enligt instruktionerna — ${formatOre(amount)}`
            : `Markera som betald — ${formatOre(amount)}`}
        </Button>

        <p className="text-xs text-center text-text-muted">
          {hasInstructions
            ? "Kassören kontrollerar betalningen mot Swish eller bank."
            : "Kontakta kassören om du är osäker på hur du ska betala."}
        </p>
      </form>
    </Card>
  );
}
