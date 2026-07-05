"use client";

import { useActionState } from "react";
import { addCollectionMembers } from "../actions";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { textareaClass } from "@/lib/ui";

type State = { error: string | null; added: number; skipped: string[] };
const initial: State = { error: null, added: 0, skipped: [] };

export function AddMembersForm({
  collectionId,
  isFreeForm,
}: {
  collectionId: string;
  isFreeForm: boolean;
}) {
  const boundAction = addCollectionMembers.bind(null, collectionId);
  const [state, action, isPending] = useActionState(boundAction, initial);

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-border bg-surface-alt/40">
        <SectionLabel>Lägg till deltagare</SectionLabel>
        {isFreeForm && (
          <p className="text-xs text-text-muted mt-1">
            Obs: förfrågan saknar deltagarlista ännu. Att lägga till deltagare aktiverar namnvalsflödet på betalningssidan.
          </p>
        )}
      </div>

      <form action={action} className="p-5 flex flex-col gap-3">
        <Field label="Namn (ett per rad)">
          <textarea
            name="names"
            rows={4}
            placeholder={"Anna Lindqvist\nErik Johansson\nMaria Svensson"}
            className={`${textareaClass} font-mono`}
          />
        </Field>

        {state.error && (
          <p className="text-sm text-danger bg-danger-light border border-danger/20 rounded px-3 py-2">
            {state.error}
          </p>
        )}

        {!state.error && state.added > 0 && (
          <div className="text-sm bg-success-light border border-success/20 rounded px-3 py-2 flex flex-col gap-1">
            <p className="text-success font-medium">
              {state.added} {state.added === 1 ? "deltagare tillagd" : "deltagare tillagda"}.
            </p>
            {state.skipped.length > 0 && (
              <p className="text-text-muted text-xs">
                {state.skipped.length} hoppades över (redan i listan):{" "}
                {state.skipped.join(", ")}.
              </p>
            )}
          </div>
        )}

        <Button type="submit" variant="primary" disabled={isPending} className="self-start">
          {isPending ? "Lägger till…" : "Lägg till deltagare"}
        </Button>
      </form>
    </Card>
  );
}
