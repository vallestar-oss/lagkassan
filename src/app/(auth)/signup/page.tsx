"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthState } from "../actions";
import { buttonClass, inputClass } from "@/lib/ui";
import { FormError } from "@/components/ui/FormError";

const initial: AuthState = { error: null };

export default function SignupPage() {
  const [state, action, isPending] = useActionState(signUp, initial);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Skapa konto</h1>
        <p className="text-sm text-text-muted mt-1">
          Har du redan ett konto?{" "}
          <Link href="/login" className="text-accent hover:underline font-medium">
            Logga in
          </Link>
        </p>
      </div>

      <FormError message={state.error} />

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-primary">Ditt namn</span>
          <input
            name="full_name"
            type="text"
            required
            autoComplete="name"
            placeholder="Anna Lindqvist"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-primary">E-postadress</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="kassoren@foreningen.se"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-text-primary">Lösenord</span>
            <span className="text-xs text-text-muted">Minst 8 tecken</span>
          </div>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
            className={inputClass}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={buttonClass("primary", "md", "w-full")}
      >
        {isPending ? "Skapar konto…" : "Skapa konto gratis"}
      </button>

      <p className="text-xs text-text-muted text-center leading-relaxed">
        Genom att skapa ett konto godkänner du våra{" "}
        <Link href="/villkor" className="underline hover:text-text-primary">
          villkor
        </Link>{" "}
        och{" "}
        <Link href="/integritetspolicy" className="underline hover:text-text-primary">
          integritetspolicy
        </Link>
        .
      </p>
    </form>
  );
}
