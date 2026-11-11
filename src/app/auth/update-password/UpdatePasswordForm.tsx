"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updatePassword, type UpdatePasswordState } from "./actions";
import { buttonClass, inputClass } from "@/lib/ui";
import { FormError } from "@/components/ui/FormError";

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

      <FormError message={state.error} />

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
            className={inputClass}
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
            className={inputClass}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={buttonClass("primary", "md", "w-full")}
      >
        {isPending ? "Uppdaterar…" : "Uppdatera lösenord"}
      </button>
    </form>
  );
}
