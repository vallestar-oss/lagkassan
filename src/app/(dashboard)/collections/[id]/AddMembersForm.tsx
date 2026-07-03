"use client";

import { useActionState } from "react";
import { addCollectionMembers } from "../actions";

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
    <div className="bg-white border border-surface-border rounded-lg shadow-card overflow-hidden">
      <div className="px-5 py-3 border-b border-surface-border">
        <p className="text-sm font-semibold text-text-primary">Lägg till deltagare</p>
        {isFreeForm && (
          <p className="text-xs text-text-muted mt-0.5">
            Obs: förfrågan saknar deltagarlista ännu. Att lägga till deltagare aktiverar namnvalsflödet på betalningssidan.
          </p>
        )}
      </div>

      <form action={action} className="p-5 flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-primary">
            Namn{" "}
            <span className="text-text-muted font-normal">(ett per rad)</span>
          </span>
          <textarea
            name="names"
            rows={4}
            placeholder={"Anna Lindqvist\nErik Johansson\nMaria Svensson"}
            className="border border-surface-border rounded-md px-3 py-2 text-sm bg-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors resize-none font-mono"
          />
        </label>

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

        <button
          type="submit"
          disabled={isPending}
          className="self-start bg-accent text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Lägger till…" : "Lägg till deltagare"}
        </button>
      </form>
    </div>
  );
}
