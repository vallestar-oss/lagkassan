"use client";

import { useActionState } from "react";
import { submitMockPayment, type PaymentState } from "./actions";
import { formatOre } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/lib/ui";
import { FormError } from "@/components/ui/FormError";
import { NoMoneyNote, PaymentSuccess } from "./PaymentParts";

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
      <PaymentSuccess message="Din betalning har markerats som gjord. Kassören behöver fortfarande kontrollera betalningen." />
    );
  }

  return (
    <Card className="p-6">
      <form action={action} className="flex flex-col gap-5">
        <p className="text-sm font-semibold text-text-primary">Din information</p>

        <FormError message={state.error} />

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

        <NoMoneyNote />

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
