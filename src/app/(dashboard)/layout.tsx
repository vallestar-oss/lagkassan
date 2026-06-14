import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guard: Supabase not configured yet → skip auth check so dev can browse.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return (
      <div className="min-h-screen bg-surface">
        <TopBar email="(Supabase ej konfigurerat)" />
        <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-surface">
      <TopBar email={user.email ?? ""} />
      <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}

function TopBar({ email }: { email: string }) {
  return (
    <header className="border-b border-surface-border bg-white sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <span className="font-bold text-text-primary tracking-tight">Lagkassan</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-muted hidden sm:block">{email}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-text-muted border border-surface-border rounded-md px-3 py-1.5 hover:border-text-muted hover:text-text-primary transition-colors"
            >
              Logga ut
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
