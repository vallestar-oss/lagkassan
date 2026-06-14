import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

function IconPlus() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function IconCollection() {
  return (
    <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  );
}

async function getProfile(): Promise<{ full_name: string | null } | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data;
}

export default async function DashboardPage() {
  const profile = await getProfile();
  const firstName = profile?.full_name?.split(" ")[0] ?? "där";

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Välkommen, {firstName}!
        </h1>
        <p className="text-text-muted mt-1">
          Det här är din dashboard. Skapa en förening för att komma igång.
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link
          href="/collections/new"
          className="flex items-center gap-2 bg-accent text-white text-sm font-semibold px-4 py-2.5 rounded-md hover:bg-accent-hover transition-colors"
        >
          <IconPlus />
          Ny betalningsförfrågan
        </Link>
      </div>

      {/* Empty state */}
      <div className="border border-surface-border border-dashed rounded-lg bg-white p-12 flex flex-col items-center text-center gap-4">
        <IconCollection />
        <div>
          <p className="font-semibold text-text-primary">Inga betalningsförfrågningar än</p>
          <p className="text-sm text-text-muted mt-1 max-w-xs">
            Skapa din första förfrågan, dela länken med medlemmarna och se vem
            som betalt — i realtid.
          </p>
        </div>
        <Link
          href="/collections/new"
          className="text-sm font-medium text-accent hover:underline"
        >
          Skapa din första förfrågan →
        </Link>
      </div>

      {/* Setup checklist */}
      <div className="bg-accent-light border border-accent/20 rounded-lg p-6">
        <p className="font-semibold text-text-primary mb-4">Kom igång på 3 steg</p>
        <ol className="flex flex-col gap-3">
          {[
            { done: true, label: "Skapa ett konto" },
            { done: false, label: "Skapa en betalningsförfrågan" },
            { done: false, label: "Dela länken med dina medlemmar" },
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  item.done
                    ? "bg-success text-white"
                    : "bg-white border border-surface-border text-text-muted"
                }`}
              >
                {item.done ? "✓" : i + 1}
              </span>
              <span className={item.done ? "line-through text-text-muted" : "text-text-primary"}>
                {item.label}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
