"use client";

import { useActionState } from "react";
import { updatePaymentInstructions } from "../actions";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { textareaClass } from "@/lib/ui";

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
      <Field label="Betalningsinstruktioner" helperText="Visas för medlemmen på betalningssidan. Lämna tomt för att ta bort.">
        <textarea
          name="payment_instructions"
          rows={4}
          defaultValue={current ?? ""}
          placeholder="Exempel: Swisha 850 kr till 070-xxx xx xx och skriv spelarens namn."
          className={textareaClass}
        />
      </Field>

      {state.error && (
        <p className="text-sm text-danger bg-danger-light border border-danger/20 rounded px-3 py-2">
          {state.error}
        </p>
      )}

      {state.saved && !state.error && (
        <p className="text-sm text-success">Instruktionerna har sparats.</p>
      )}

      <Button type="submit" variant="primary" disabled={isPending} className="self-start">
        {isPending ? "Sparar…" : "Spara instruktioner"}
      </Button>
    </form>
  );
}
