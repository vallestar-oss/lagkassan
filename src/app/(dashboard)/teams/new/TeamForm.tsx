"use client";

import { useActionState } from "react";
import { createTeam, type TeamState } from "../actions";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { cardClass, inputClass, cn } from "@/lib/ui";

const initial: TeamState = { error: null };

export function TeamForm({ isFirstTeam }: { isFirstTeam: boolean }) {
  const [state, action, isPending] = useActionState(createTeam, initial);

  return (
    <form action={action} className={cn(cardClass, "p-6 sm:p-7 flex flex-col gap-5")}>
      {state.error && (
        <p className="text-sm text-danger bg-danger-light border border-danger/20 rounded px-3 py-2">
          {state.error}
        </p>
      )}

      <Field label="Namn på laget/gruppen">
        <input
          name="name"
          type="text"
          required
          autoFocus
          placeholder="t.ex. Pojkar 2012, Klass 9B, Seniorlaget"
          className={inputClass}
        />
      </Field>

      <Field label="Beskrivning" optional>
        <input
          name="description"
          type="text"
          placeholder="t.ex. Löparsektionen, 85 aktiva medlemmar"
          className={inputClass}
        />
      </Field>

      <Button type="submit" variant="primary" disabled={isPending} className="w-full">
        {isPending ? "Skapar…" : isFirstTeam ? "Skapa lag" : "Skapa nytt lag"}
      </Button>
    </form>
  );
}
