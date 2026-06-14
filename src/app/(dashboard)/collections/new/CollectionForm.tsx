"use client";

import { useActionState } from "react";
import { createCollection, type CollectionState } from "../actions";

const initial: CollectionState = { error: null };

export function CollectionForm({
  teams,
}: {
  teams: { id: string; name: string }[];
}) {
  const [state, action, isPending] = useActionState(createCollection, initial);

  return (
    <form
      action={action}
      className="bg-white border border-surface-border rounded-lg p-6 shadow-card flex flex-col gap-5"
    >
      {state.error && (
        <p className="text-sm text-danger bg-danger-light border border-danger/20 rounded px-3 py-2">
          {state.error}
        </p>
      )}

      {/* Hidden team selector — shows dropdown only if user has multiple teams */}
      {teams.length === 1 ? (
        <input type="hidden" name="team_id" value={teams[0].id} />
      ) : (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-primary">Förening</span>
          <select
            name="team_id"
            required
            className="border border-surface-border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text-primary">Rubrik</span>
        <input
          name="title"
          type="text"
          required
          autoFocus
          placeholder="t.ex. Höstterminsavgift 2026"
          className="border border-surface-border rounded-md px-3 py-2 text-sm bg-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text-primary">
          Beskrivning{" "}
          <span className="text-text-muted font-normal">(valfritt)</span>
        </span>
        <input
          name="description"
          type="text"
          placeholder="t.ex. Avgift för höstterminens träningar"
          className="border border-surface-border rounded-md px-3 py-2 text-sm bg-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text-primary">Belopp (kr)</span>
        <div className="relative">
          <input
            name="amount"
            type="number"
            required
            min="1"
            step="1"
            placeholder="299"
            className="w-full border border-surface-border rounded-md px-3 py-2 pr-10 text-sm font-mono bg-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none">
            kr
          </span>
        </div>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text-primary">
          Sista betalningsdag{" "}
          <span className="text-text-muted font-normal">(valfritt)</span>
        </span>
        <input
          name="deadline"
          type="date"
          className="border border-surface-border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors"
        />
      </label>

      <div className="pt-1 flex flex-col gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-accent text-white font-semibold text-sm py-2.5 rounded-md hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Skapar…" : "Skapa och hämta länk"}
        </button>
        {teams.length === 1 && (
          <p className="text-xs text-text-muted text-center">
            Skapas för <span className="font-medium">{teams[0].name}</span>
          </p>
        )}
      </div>
    </form>
  );
}
