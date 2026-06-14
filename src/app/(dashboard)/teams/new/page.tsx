"use client";

import { useActionState } from "react";
import { createTeam, type TeamState } from "../actions";

const initial: TeamState = { error: null };

export default function NewTeamPage() {
  const [state, action, isPending] = useActionState(createTeam, initial);

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Skapa din förening</h1>
        <p className="text-text-muted mt-1 text-sm">
          Ge din förening ett namn — du kan ändra det senare.
        </p>
      </div>

      <form
        action={action}
        className="bg-white border border-surface-border rounded-lg p-6 shadow-card flex flex-col gap-5"
      >
        {state.error && (
          <p className="text-sm text-danger bg-danger-light border border-danger/20 rounded px-3 py-2">
            {state.error}
          </p>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-primary">Föreningens namn</span>
          <input
            name="name"
            type="text"
            required
            autoFocus
            placeholder="t.ex. IFK Örby Friidrott"
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
            placeholder="t.ex. Löparsektionen, 85 aktiva medlemmar"
            className="border border-surface-border rounded-md px-3 py-2 text-sm bg-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors"
          />
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-accent text-white font-semibold text-sm py-2.5 rounded-md hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Skapar…" : "Skapa förening"}
        </button>
      </form>
    </div>
  );
}
