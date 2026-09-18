"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, signInAsGuest, type AuthState, type GuestState } from "../actions";
import { Suspense } from "react";

const initial: AuthState = { error: null };
const guestInitial: GuestState = { error: null };

function LoginForm() {
  const [state, action, isPending] = useActionState(signIn, initial);
  const [guestState, guestAction, guestIsPending] = useActionState(signInAsGuest, guestInitial);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Logga in</h1>
        <p className="text-sm text-text-muted mt-1">
          Inget konto?{" "}
          <Link href="/signup" className="text-accent hover:underline font-medium">
            Skapa ett gratis
          </Link>
        </p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        {state.error && (
          <p className="text-sm text-danger bg-danger-light border border-danger/20 rounded px-3 py-2">
            {state.error}
          </p>
        )}

        {/* Pass redirect through the form so the server action can use it */}
        {redirect && <input type="hidden" name="redirect" value={redirect} />}

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-primary">E-postadress</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="kassoren@foreningen.se"
              className="border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary bg-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-primary">Lösenord</span>
              <Link href="/forgot-password" className="text-xs text-accent hover:underline font-medium">
                Glömt lösenord?
              </Link>
            </div>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary bg-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-accent text-white font-semibold text-sm py-2.5 rounded-md hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Loggar in…" : "Logga in"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span className="h-px flex-1 bg-surface-border" />
        eller
        <span className="h-px flex-1 bg-surface-border" />
      </div>

      <form action={guestAction} className="flex flex-col gap-2">
        <p className="text-sm text-text-muted">
          Testa appen direkt med ett tomt konto — inget lösenord, ingen e-post.
        </p>

        {guestState.error && (
          <p className="text-sm text-danger bg-danger-light border border-danger/20 rounded px-3 py-2">
            {guestState.error}
          </p>
        )}

        <input
          name="guest_name"
          type="text"
          autoComplete="off"
          placeholder="Ditt namn"
          maxLength={100}
          className="border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary bg-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors"
        />

        <button
          type="submit"
          disabled={guestIsPending}
          className="w-full border border-surface-border text-text-primary font-semibold text-sm py-2.5 rounded-md hover:bg-surface-border/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {guestIsPending ? "Startar…" : "Testa utan konto"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
