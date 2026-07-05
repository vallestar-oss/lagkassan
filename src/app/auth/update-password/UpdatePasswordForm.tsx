"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updatePassword, type UpdatePasswordState } from "./actions";

const initial: UpdatePasswordState = { error: null, success: false };

export function UpdatePasswordForm() {
  const router = useRouter();
  const [state, action, isPending] = useActionState(updatePassword, initial);

  useEffect(() => {
    if (state.success) {
      const id = setTimeout(() => router.push("/dashboard"), 1500);
      return () => clearTimeout(id);
    }
  }, [state.success, router]);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-xl font-bold text-text-primary">Lösenordet har uppdaterats</h1>
        <p className="text-sm text-text-muted">Du skickas vidare till din översikt…</p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Nytt lösenord</h1>
        <p className="text-sm text-text-muted mt-1">Välj ett nytt lösenord för ditt konto.</p>
      </div>

      {state.error && (
        <p className="text-sm text-danger bg-danger-light border border-danger/20 rounded px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-text-primary">Nytt lösenord</span>
            <span className="text-xs text-text-muted">Minst 8 tecken</span>
          </div>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
            className="border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary bg-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-primary">Bekräfta lösenord</span>
          <input
            name="confirm_password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
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
        {isPending ? "Uppdaterar…" : "Uppdatera lösenord"}
      </button>
    </form>
  );
}
