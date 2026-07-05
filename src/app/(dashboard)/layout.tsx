import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import { Sidebar } from "./Sidebar";
import { Button } from "@/components/ui/Button";

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
      <div className="min-h-screen bg-surface flex">
        <Sidebar teams={[]} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar email="(Supabase ej konfigurerat)" />
          <main className="max-w-5xl mx-auto px-6 py-10 w-full">{children}</main>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("team_members")
    .select("teams(id, name)")
    .eq("user_id", user.id);

  const teams = (memberships ?? [])
    .map((m) => m.teams as { id: string; name: string } | null)
    .filter((t): t is { id: string; name: string } => t !== null);

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar teams={teams} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar email={user.email ?? ""} />
        <main className="max-w-5xl mx-auto px-6 py-10 w-full">{children}</main>
      </div>
    </div>
  );
}

function TopBar({ email }: { email: string }) {
  return (
    <header className="border-b border-surface-border bg-shell/60 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="font-bold text-text-primary tracking-tight md:hidden">Lagkassan</span>
        <span className="hidden md:block" />
        <div className="flex items-center gap-3 sm:gap-5">
          <a
            href="mailto:hej@lagkassan.se?subject=Feedback%20om%20Lagkassan"
            className="text-sm text-text-muted hover:text-text-primary transition-colors hidden sm:block"
          >
            Ge feedback
          </a>
          <span className="text-sm text-text-muted hidden sm:block border-l border-surface-border pl-5">
            {email}
          </span>
          <form action={signOut}>
            <Button type="submit" variant="secondary" size="sm">
              Logga ut
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
