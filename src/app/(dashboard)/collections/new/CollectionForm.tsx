"use client";

import { useActionState, useState } from "react";
import { createCollection, type CollectionState } from "../actions";

const initial: CollectionState = { error: null };

type RosterMember = { id: string; name: string };

export function CollectionForm({
  teams,
  rosterByTeam,
}: {
  teams: { id: string; name: string }[];
  rosterByTeam: Record<string, RosterMember[]>;
}) {
  const [state, action, isPending] = useActionState(createCollection, initial);
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? "");

  const roster = rosterByTeam[selectedTeamId] ?? [];

  // All roster members checked by default; treasurer can uncheck.
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(roster.map((m) => [m.id, true]))
  );

  // Extra names not in the roster (free-text, added dynamically).
  const [extras, setExtras] = useState<string[]>([]);

  function toggleMember(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function addExtra() {
    setExtras((prev) => [...prev, ""]);
  }

  function setExtra(i: number, val: string) {
    setExtras((prev) => prev.map((v, idx) => (idx === i ? val : v)));
  }

  function removeExtra(i: number) {
    setExtras((prev) => prev.filter((_, idx) => idx !== i));
  }

  // When the team changes, reset check state and extras to match new roster.
  function handleTeamChange(teamId: string) {
    setSelectedTeamId(teamId);
    const newRoster = rosterByTeam[teamId] ?? [];
    setChecked(Object.fromEntries(newRoster.map((m) => [m.id, true])));
    setExtras([]);
  }

  const selectedCount =
    roster.filter((m) => checked[m.id]).length +
    extras.filter((e) => e.trim()).length;

  return (
    <form
      action={action}
      className="flex flex-col gap-5"
    >
      {state.error && (
        <p className="text-sm text-danger bg-danger-light border border-danger/20 rounded px-3 py-2">
          {state.error}
        </p>
      )}

      {/* Team selector (hidden when only one team) */}
      {teams.length === 1 ? (
        <input type="hidden" name="team_id" value={teams[0].id} />
      ) : (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-primary">Förening</span>
          <select
            name="team_id"
            required
            value={selectedTeamId}
            onChange={(e) => handleTeamChange(e.target.value)}
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

      {/* Collection details */}
      <div className="bg-white border border-surface-border rounded-lg p-5 shadow-card flex flex-col gap-4">
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
      </div>

      {/* Roster checklist */}
      <div className="bg-white border border-surface-border rounded-lg p-5 shadow-card flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-text-primary">
            Vem ska betala?
          </p>
          {selectedCount > 0 && (
            <span className="text-xs text-text-muted">{selectedCount} valda</span>
          )}
        </div>

        {roster.length === 0 ? (
          <p className="text-sm text-text-muted">
            Inga medlemmar i listan ännu —{" "}
            <a href={`/teams/${selectedTeamId}`} className="text-accent hover:underline">
              lägg till medlemmar
            </a>{" "}
            för att förifylla den här listan automatiskt, eller lägg till
            namn direkt nedan.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-surface-border -mx-5 px-5">
            {roster.map((m) => (
              <li key={m.id} className="py-2.5 flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`member-${m.id}`}
                  checked={checked[m.id] ?? true}
                  onChange={() => toggleMember(m.id)}
                  className="w-4 h-4 rounded border-surface-border accent-accent flex-shrink-0 cursor-pointer"
                />
                {/* Submit the name only when checked — unchecked checkboxes don't submit */}
                {checked[m.id] && (
                  <input type="hidden" name="member_name" value={m.name} />
                )}
                <label
                  htmlFor={`member-${m.id}`}
                  className={`text-sm cursor-pointer select-none flex-1 ${
                    checked[m.id] ? "text-text-primary" : "text-text-muted line-through"
                  }`}
                >
                  {m.name}
                </label>
              </li>
            ))}
          </ul>
        )}

        {/* Extra names not in roster */}
        {extras.map((val, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              name="extra_name"
              value={val}
              onChange={(e) => setExtra(i, e.target.value)}
              placeholder="Namn"
              className="flex-1 border border-surface-border rounded-md px-3 py-2 text-sm bg-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors"
            />
            <button
              type="button"
              onClick={() => removeExtra(i)}
              className="text-text-muted hover:text-danger transition-colors text-lg leading-none flex-shrink-0 px-1"
              aria-label="Ta bort"
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addExtra}
          className="text-sm text-accent hover:text-accent-hover transition-colors text-left font-medium"
        >
          + Lägg till person som inte är i listan
        </button>
      </div>

      <div className="flex flex-col gap-2">
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
