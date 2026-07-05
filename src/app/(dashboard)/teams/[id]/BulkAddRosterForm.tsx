"use client";

import { useActionState } from "react";
import { addRosterMembersBulk, type BulkRosterState } from "../actions";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { textareaClass } from "@/lib/ui";

const initial: BulkRosterState = { error: null, added: 0, skipped: [] };

export function BulkAddRosterForm({ teamId }: { teamId: string }) {
  const boundAction = addRosterMembersBulk.bind(null, teamId);
  const [state, action, isPending] = useActionState(boundAction, initial);

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold text-text-primary">Lägg till flera medlemmar</p>
        <p className="text-xs text-text-muted mt-0.5">
          Medlemmarna används när du skapar betalningsförfrågningar för laget.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-3">
        <Field label="Klistra in en medlem per rad">
          <textarea
            name="names"
            rows={5}
            placeholder={"Exempel: Anna Svensson\nOlle Karlsson\nHannes Nilsson"}
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
              {state.added} {state.added === 1 ? "medlem tillagd" : "medlemmar tillagda"}.
            </p>
            {state.skipped.length > 0 && (
              <p className="text-text-muted text-xs">
                {state.skipped.length} hoppades över eftersom de redan fanns:{" "}
                {state.skipped.join(", ")}.
              </p>
            )}
          </div>
        )}

        <Button type="submit" variant="primary" disabled={isPending} className="w-full sm:w-auto sm:self-start">
          {isPending ? "Lägger till…" : "Lägg till medlemmar"}
        </Button>
      </form>
    </Card>
  );
}
