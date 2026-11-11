"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type ForgotPasswordState } from "../actions";
import { buttonClass, inputClass } from "@/lib/ui";

const initial: ForgotPasswordState = { submitted: false };

export default function ForgotPasswordPage() {
  const [state, action, isPending] = useActionState(requestPasswordReset, initial);

  if (state.submitted) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-xl font-bold text-text-primary">Kolla din e-post</h1>
        <p className="text-sm text-text-muted">
          Om kontot finns skickar vi en länk för att återställa lösenordet.
        </p>
        <Link href="/login" className="text-sm text-accent hover:underline font-medium">
          ← Tillbaka till inloggning
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Återställ lösenord</h1>
        <p className="text-sm text-text-muted mt-1">
          Ange din e-postadress så skickar vi en länk för att återställa lösenordet.
        </p>
      </div>

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

      <button
        type="submit"
        disabled={isPending}
        className={buttonClass("primary", "md", "w-full")}
      >
        {isPending ? "Skickar…" : "Skicka återställningslänk"}
      </button>

      <p className="text-sm text-text-muted text-center">
        <Link href="/login" className="text-accent hover:underline font-medium">
          ← Tillbaka till inloggning
        </Link>
      </p>
    </form>
  );
}
