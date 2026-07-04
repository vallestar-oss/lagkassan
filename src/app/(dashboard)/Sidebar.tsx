"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Team = { id: string; name: string };

export function Sidebar({ teams }: { teams: Team[] }) {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 border-r border-surface-border bg-white hidden md:flex md:flex-col">
      <div className="h-14 flex items-center px-5 border-b border-surface-border">
        <Link href="/dashboard" className="font-bold text-text-primary tracking-tight">
          Lagkassan
        </Link>
      </div>

      <nav className="flex-1 flex flex-col gap-4 px-3 py-5 overflow-y-auto">
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-2 mb-2">
            Mina lag
          </p>

          {teams.length === 0 ? (
            <p className="text-sm text-text-muted px-2 mb-2">
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
                      className={`block px-2 py-1.5 rounded-md text-sm truncate transition-colors ${
                        isActive
                          ? "bg-accent-light text-accent font-medium"
                          : "text-text-primary hover:bg-surface-alt"
                      }`}
                    >
                      {t.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            href="/teams/new"
            className="flex items-center gap-1.5 px-2 py-1.5 mt-1 rounded-md text-sm font-medium text-accent hover:bg-accent-light transition-colors"
          >
            <span className="text-base leading-none">+</span>{" "}
            {teams.length === 0 ? "Skapa ditt första lag" : "Lägg till lag"}
          </Link>
        </div>

        <div className="border-t border-surface-border pt-4">
          <Link
            href="/dashboard"
            className={`block px-2 py-1.5 rounded-md text-sm transition-colors ${
              pathname === "/dashboard"
                ? "bg-accent-light text-accent font-medium"
                : "text-text-muted hover:bg-surface-alt hover:text-text-primary"
            }`}
          >
            Översikt
          </Link>
          <Link
            href="/guide"
            className={`block px-2 py-1.5 rounded-md text-sm transition-colors ${
              pathname === "/guide"
                ? "bg-accent-light text-accent font-medium"
                : "text-text-muted hover:bg-surface-alt hover:text-text-primary"
            }`}
          >
            Så testar du Lagkassan
          </Link>
        </div>
      </nav>
    </aside>
  );
}
