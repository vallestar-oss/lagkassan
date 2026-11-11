import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AuthShell } from "@/components/AuthShell";
import { UpdatePasswordForm } from "./UpdatePasswordForm";

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <AuthShell>
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
    </AuthShell>
  );
}
