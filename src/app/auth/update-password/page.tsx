import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UpdatePasswordForm } from "./UpdatePasswordForm";

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="font-bold text-xl text-text-primary mb-8 tracking-tight hover:text-accent transition-colors"
      >
        Lagkassan
      </Link>
      <div className="w-full max-w-sm bg-white border border-surface-border rounded-lg shadow-card p-8">
        {user ? (
          <UpdatePasswordForm />
        ) : (
          <div className="flex flex-col gap-4 text-center">
            <h1 className="text-xl font-bold text-text-primary">Länken är ogiltig</h1>
            <p className="text-sm text-text-muted">
              Länken är ogiltig eller har gått ut. Begär en ny återställningslänk.
            </p>
            <Link href="/forgot-password" className="text-sm text-accent hover:underline font-medium">
              Begär ny länk
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
