"use client";

import { useActionState, useState } from "react";
import { createCollection, type CollectionState } from "../actions";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { inputClass, textareaClass } from "@/lib/ui";

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
    <form action={action} className="flex flex-col gap-5">
      {state.error && (
        <p className="text-sm text-danger bg-danger-light border border-danger/20 rounded px-3 py-2">
          {state.error}
        </p>
      )}

      {/* Team selector (read-only info panel when only one team) */}
      {teams.length === 1 ? (
        <div className="bg-accent-light border border-accent/20 rounded-lg px-4 py-3">
          <input type="hidden" name="team_id" value={teams[0].id} />
          <p className="text-sm text-text-primary">
            Skapas för: <span className="font-semibold">{teams[0].name}</span>
          </p>
          <p className="text-xs text-text-muted mt-1">
            Medlemmarna hämtas från lagets medlemslista.
          </p>
        </div>
      ) : (
        <Field label="Välj lag/grupp" helperText="Medlemmarna hämtas från lagets medlemslista.">
          <select
            name="team_id"
            required
            value={selectedTeamId}
            onChange={(e) => handleTeamChange(e.target.value)}
            className={inputClass}
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      {/* Collection details */}
      <Card className="p-5 flex flex-col gap-4">
        <Field label="Rubrik">
          <input
            name="title"
            type="text"
            required
            autoFocus
            placeholder="t.ex. Höstterminsavgift 2026"
            className={inputClass}
          />
        </Field>

        <Field label="Beskrivning" optional>
          <input
            name="description"
            type="text"
            placeholder="t.ex. Avgift för höstterminens träningar"
            className={inputClass}
          />
        </Field>

        <Field
          label="Betalningsinstruktioner"
          optional
          helperText="Lagkassan hanterar inte själva betalningen ännu. Instruktionerna visas för medlemmen på betalningssidan."
        >
          <textarea
            name="payment_instructions"
            rows={3}
            placeholder="Exempel: Swisha 850 kr till 070-xxx xx xx och skriv spelarens namn."
            className={textareaClass}
          />
        </Field>

        <Field label="Belopp (kr)">
          <div className="relative">
            <input
              name="amount"
              type="number"
              required
              min="1"
              step="1"
              placeholder="299"
              className={`${inputClass} pr-10 font-mono`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none">
              kr
            </span>
          </div>
        </Field>

        <Field label="Sista betalningsdag" optional>
          <input name="deadline" type="date" className={inputClass} />
        </Field>
      </Card>

      {/* Roster checklist */}
      <Card className="p-5 flex flex-col gap-3">
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
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => removeExtra(i)}
              className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-danger transition-colors text-lg leading-none flex-shrink-0 rounded-md hover:bg-danger-light"
              aria-label={`Ta bort ${val || "namn"}`}
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
      </Card>

      <Button type="submit" variant="primary" disabled={isPending} className="w-full">
        {isPending ? "Skapar…" : "Skapa och hämta länk"}
      </Button>
    </form>
  );
}
