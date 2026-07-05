"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Team = { id: string; name: string };

export function Sidebar({ teams }: { teams: Team[] }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-surface-border bg-shell hidden md:flex md:flex-col">
      <div className="h-16 flex items-center px-6">
        <Link href="/dashboard" className="font-bold text-text-primary tracking-tight text-[15px]">
          Lagkassan
        </Link>
      </div>

      <nav className="flex-1 flex flex-col gap-6 px-4 pb-6 overflow-y-auto">
        <div>
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-2.5 mb-2.5">
            Mina lag
          </p>

          {teams.length === 0 ? (
            <p className="text-sm text-text-muted px-2.5 mb-2">
              Inga lag ännu.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {teams.map((t) => {
                const isActive = pathname === `/teams/${t.id}`;
                return (
                  <li key={t.id}>
                    <Link
                      href={`/teams/${t.id}`}
                      className={`flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-md text-sm truncate transition-colors ${
                        isActive
                          ? "bg-white text-accent font-medium shadow-sm"
                          : "text-text-primary hover:bg-white/70"
                      }`}
                    >
                      <span className="truncate">{t.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            href="/teams/new"
            className="flex items-center gap-1.5 pl-3 pr-2.5 py-2 mt-1 rounded-md text-sm font-medium text-accent hover:bg-white/70 transition-colors"
          >
            <span className="text-base leading-none">+</span>{" "}
            {teams.length === 0 ? "Skapa ditt första lag" : "Lägg till lag"}
          </Link>
        </div>

        <div className="border-t border-surface-border pt-5 flex flex-col gap-0.5">
          <Link
            href="/dashboard"
            className={`pl-3 pr-2.5 py-2 rounded-md text-sm transition-colors ${
              pathname === "/dashboard"
                ? "bg-white text-accent font-medium shadow-sm"
                : "text-text-muted hover:bg-white/70 hover:text-text-primary"
            }`}
          >
            Översikt
          </Link>
          <Link
            href="/guide"
            className={`pl-3 pr-2.5 py-2 rounded-md text-sm transition-colors ${
              pathname === "/guide"
                ? "bg-white text-accent font-medium shadow-sm"
                : "text-text-muted hover:bg-white/70 hover:text-text-primary"
            }`}
          >
            Så testar du Lagkassan
          </Link>
        </div>
      </nav>
    </aside>
  );
}
