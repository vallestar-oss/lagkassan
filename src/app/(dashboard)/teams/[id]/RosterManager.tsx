"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  addRosterMember,
  updateRosterMember,
  deleteRosterMember,
  type RosterState,
} from "../actions";

type Member = { id: string; name: string; phone: string | null };

const initial: RosterState = { error: null };

export function RosterManager({
  teamId,
  members,
  canManage,
}: {
  teamId: string;
  members: Member[];
  canManage: boolean;
}) {
  const [state, action, isPending] = useActionState(addRosterMember, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  // Clear the add form only after a submit that completed without an error.
  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      formRef.current?.reset();
    }
    wasPending.current = isPending;
  }, [isPending, state]);

  return (
    <div className="flex flex-col gap-5">
      {/* Add form */}
      {canManage && (
        <form
          ref={formRef}
          action={action}
          className="bg-white border border-surface-border rounded-lg p-5 shadow-card flex flex-col gap-4"
        >
          <p className="text-sm font-semibold text-text-primary">
            Lägg till medlem
          </p>

          {state.error && (
            <p className="text-sm text-danger bg-danger-light border border-danger/20 rounded px-3 py-2">
              {state.error}
            </p>
          )}

          <input type="hidden" name="team_id" value={teamId} />

          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex flex-col gap-1.5 flex-1">
              <span className="text-sm font-medium text-text-primary">Namn</span>
              <input
                name="name"
                type="text"
                required
                placeholder="Anna Lindqvist"
                className="border border-surface-border rounded-md px-3 py-2 text-sm bg-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors"
              />
            </label>
            <label className="flex flex-col gap-1.5 flex-1">
              <span className="text-sm font-medium text-text-primary">
                Telefon{" "}
                <span className="text-text-muted font-normal">(valfritt)</span>
              </span>
              <input
                name="phone"
                type="tel"
                placeholder="070-123 45 67"
                className="border border-surface-border rounded-md px-3 py-2 text-sm bg-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors"
              />
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="bg-accent text-white font-semibold text-sm px-4 py-2 rounded-md hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? "Lägger till…" : "Lägg till"}
            </button>
          </div>
        </form>
      )}

      {/* Member list */}
      <div className="bg-white border border-surface-border rounded-lg shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-surface-border">
          <p className="text-sm font-semibold text-text-primary">
            Medlemmar{" "}
            <span className="text-text-muted font-normal">({members.length})</span>
          </p>
        </div>

        {members.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-text-muted">
              Inga medlemmar än.{" "}
              {canManage && "Lägg till namn ovan för att bygga din lista."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-surface-border">
            {members.map((m) => (
              <RosterRow
                key={m.id}
                member={m}
                teamId={teamId}
                canManage={canManage}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RosterRow({
  member,
  teamId,
  canManage,
}: {
  member: Member;
  teamId: string;
  canManage: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(member.name);
  const [phone, setPhone] = useState(member.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    const res = await updateRosterMember(member.id, teamId, name, phone || null);
    setBusy(false);
    if (res.error) {
      setErr(res.error);
      return;
    }
    setEditing(false);
  }

  function cancel() {
    setName(member.name);
    setPhone(member.phone ?? "");
    setErr(null);
    setEditing(false);
  }

  async function remove() {
    setBusy(true);
    await deleteRosterMember(member.id, teamId);
    // revalidatePath refreshes the page; this row drops out of the list.
  }

  if (editing) {
    return (
      <li className="px-5 py-3 flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Namn"
            className="flex-1 border border-surface-border rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Telefon (valfritt)"
            className="flex-1 border border-surface-border rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors"
          />
        </div>
        {err && <p className="text-xs text-danger">{err}</p>}
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={busy}
            className="text-xs font-medium px-3 py-1.5 rounded bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-60"
          >
            {busy ? "Sparar…" : "Spara"}
          </button>
          <button
            onClick={cancel}
            disabled={busy}
            className="text-xs font-medium px-3 py-1.5 rounded border border-surface-border text-text-muted hover:text-text-primary transition-colors"
          >
            Avbryt
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between px-5 py-3 gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {member.name}
        </p>
        {member.phone && (
          <p className="text-xs text-text-muted truncate">{member.phone}</p>
        )}
      </div>
      {canManage && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setEditing(true)}
            disabled={busy}
            className="text-xs font-medium px-2 py-1 rounded border border-surface-border text-text-muted hover:border-accent hover:text-accent transition-colors disabled:opacity-60"
          >
            Ändra
          </button>
          <button
            onClick={remove}
            disabled={busy}
            className="text-xs font-medium px-2 py-1 rounded border border-surface-border text-text-muted hover:border-danger hover:text-danger transition-colors disabled:opacity-60"
          >
            {busy ? "…" : "Ta bort"}
          </button>
        </div>
      )}
    </li>
  );
}
