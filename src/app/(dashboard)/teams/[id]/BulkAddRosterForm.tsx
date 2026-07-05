"use client";

import { useActionState } from "react";
import { addRosterMembersBulk, type BulkRosterState } from "../actions";

const initial: BulkRosterState = { error: null, added: 0, skipped: [] };

export function BulkAddRosterForm({ teamId }: { teamId: string }) {
  const boundAction = addRosterMembersBulk.bind(null, teamId);
  const [state, action, isPending] = useActionState(boundAction, initial);

  return (
    <div className="bg-white border border-surface-border rounded-lg p-5 shadow-card flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold text-text-primary">Lägg till flera medlemmar</p>
        <p className="text-xs text-text-muted mt-0.5">
          Medlemmarna används när du skapar betalningsförfrågningar för laget.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-primary">
            Klistra in en medlem per rad
          </span>
          <textarea
            name="names"
            rows={5}
            placeholder={"Exempel: Anna Svensson\nOlle Karlsson\nHannes Nilsson"}
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

        <button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto sm:self-start bg-accent text-white text-sm font-semibold px-5 py-2.5 sm:py-2 rounded-md hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Lägger till…" : "Lägg till medlemmar"}
        </button>
      </form>
    </div>
  );
}
