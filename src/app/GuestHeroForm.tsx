"use client";

import { useActionState } from "react";
import { signInAsGuest, type GuestState } from "./(auth)/actions";

const initial: GuestState = { error: null };

export function GuestHeroForm() {
  const [state, action, isPending] = useActionState(signInAsGuest, initial);

  return (
    <form action={action} className="flex flex-col sm:flex-row gap-3 justify-center items-start sm:items-center">
      <input
        name="guest_name"
        type="text"
        autoComplete="off"
        placeholder="Ditt namn"
        maxLength={100}
        className="w-full sm:w-56 border border-surface-border rounded-md px-4 py-3 text-sm text-text-primary bg-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors"
      />
      <button
        type="submit"
        disabled={isPending}
        className="w-full sm:w-auto bg-accent text-white font-semibold px-6 py-3 rounded-md hover:bg-accent-hover transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Startar…" : "Testa utan att skapa konto"}
      </button>
      {state.error && (
        <p className="text-sm text-danger w-full sm:w-auto">{state.error}</p>
      )}
    </form>
  );
}
