"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  addRosterMember,
  updateRosterMember,
  deleteRosterMember,
  type RosterState,
} from "../actions";
import { getInitials } from "@/lib/utils";
import { BulkAddRosterForm } from "./BulkAddRosterForm";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { inputClass, buttonClass } from "@/lib/ui";

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
  // Bulk paste is the default — most organizers add a whole roster at once,
  // and typing names one at a time is the slower, secondary path.
  const [showBulk, setShowBulk] = useState(true);

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
        <>
          <div className="flex items-center justify-end -mb-2">
            <button
              type="button"
              onClick={() => setShowBulk((v) => !v)}
              className={buttonClass("secondary", "sm")}
            >
              {showBulk ? "Lägg till en i taget istället" : "Lägg till flera samtidigt →"}
            </button>
          </div>

          {showBulk ? (
            <BulkAddRosterForm teamId={teamId} />
          ) : (
            <Card className="p-5">
              <form ref={formRef} action={action} className="flex flex-col gap-4">
                <SectionLabel>Lägg till medlem</SectionLabel>

                {state.error && (
                  <p className="text-sm text-danger bg-danger-light border border-danger/20 rounded px-3 py-2">
                    {state.error}
                  </p>
                )}

                <input type="hidden" name="team_id" value={teamId} />

                <div className="flex flex-col sm:flex-row gap-3">
                  <Field label="Namn">
                    <input name="name" type="text" required placeholder="Anna Lindqvist" className={inputClass} />
                  </Field>
                  <Field label="Telefon" optional>
                    <input name="phone" type="tel" placeholder="070-123 45 67" className={inputClass} />
                  </Field>
                </div>

                <Button type="submit" variant="primary" disabled={isPending} className="w-full sm:w-auto sm:self-start">
                  {isPending ? "Lägger till…" : "Lägg till"}
                </Button>
              </form>
            </Card>
          )}
        </>
      )}

      {/* Member list */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border bg-surface-alt/40">
          <SectionLabel>
            Medlemmar <span className="normal-case font-normal">({members.length})</span>
          </SectionLabel>
        </div>

        {members.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-text-muted">
              Inga medlemmar ännu.{" "}
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
      </Card>
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
    if (!window.confirm(`Ta bort ${member.name} från laget?`)) return;
    setBusy(true);
    setErr(null);
    const res = await deleteRosterMember(member.id, teamId);
    // On success, revalidatePath refreshes the page and this row drops out of
    // the list — no need to reset busy. On failure, the row stays and must
    // recover to a usable state.
    if (res.error) {
      setBusy(false);
      setErr(res.error);
    }
  }

  if (editing) {
    return (
      <li className="px-5 py-3 flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <Field label="Namn">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Telefon" optional>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </Field>
        </div>
        {err && <p className="text-xs text-danger">{err}</p>}
        <div className="flex gap-2">
          <Button onClick={save} disabled={busy} variant="primary" size="chip">
            {busy ? "Sparar…" : "Spara"}
          </Button>
          <Button onClick={cancel} disabled={busy} variant="secondary" size="chip">
            Avbryt
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between px-5 py-3 gap-x-3 gap-y-1.5 hover:bg-surface-alt/40 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-full bg-accent-light text-accent text-xs font-semibold flex items-center justify-center flex-shrink-0">
          {getInitials(member.name)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {member.name}
          </p>
          {member.phone && (
            <p className="text-xs text-text-muted truncate">{member.phone}</p>
          )}
        </div>
      </div>
      {canManage && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button onClick={() => setEditing(true)} disabled={busy} variant="secondary" size="chip">
            Ändra
          </Button>
          <Button
            onClick={remove}
            disabled={busy}
            variant="destructive"
            size="chip"
            aria-label={`Ta bort ${member.name}`}
          >
            {busy ? "…" : "Ta bort"}
          </Button>
        </div>
      )}
      {err && <p className="w-full text-xs text-danger">{err}</p>}
    </li>
  );
}
