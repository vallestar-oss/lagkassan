"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { IconGrid, IconPlus, IconUsers } from "@/components/icons";

type Team = { id: string; name: string };

function IconShield() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

const ICON = "w-4 h-4 flex-shrink-0";

export function Sidebar({ teams }: { teams: Team[] }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-surface-border bg-shell hidden md:flex md:flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-surface-border">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
            <IconShield />
            <span className="sr-only">Lagkassan</span>
          </div>
          <span className="font-bold text-text-primary tracking-tight text-[15px] group-hover:text-accent transition-colors">
            Lagkassan
          </span>
        </Link>
      </div>

      <nav className="flex-1 flex flex-col gap-6 px-3 py-4 overflow-y-auto">
        {/* Teams section */}
        <div>
          <SectionLabel className="px-2.5 mb-2">Mina lag</SectionLabel>

          {teams.length === 0 ? (
            <p className="text-sm text-text-muted px-2.5 mb-2">Inga lag ännu.</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {teams.map((t) => {
                const isActive = pathname === `/teams/${t.id}`;
                return (
                  <li key={t.id}>
                    <Link
                      href={`/teams/${t.id}`}
                      className={`flex items-center gap-2.5 pl-2.5 pr-2.5 py-2 rounded-md text-sm truncate transition-colors ${
                        isActive
                          ? "bg-white text-accent font-medium shadow-sm"
                          : "text-text-primary hover:bg-white/70"
                      }`}
                    >
                      <IconUsers className={ICON} />
                      <span className="truncate">{t.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            href="/teams/new"
            className="flex items-center gap-2.5 pl-2.5 pr-2.5 py-2 mt-1 rounded-md text-sm font-medium text-accent hover:bg-white/70 transition-colors"
          >
            <IconPlus className={ICON} />
            {teams.length === 0 ? "Skapa ditt första lag" : "Lägg till lag"}
          </Link>
        </div>

        {/* Bottom nav */}
        <div className="border-t border-surface-border pt-4 flex flex-col gap-0.5">
          <Link
            href="/dashboard"
            className={`flex items-center gap-2.5 pl-2.5 pr-2.5 py-2 rounded-md text-sm transition-colors ${
              pathname === "/dashboard"
                ? "bg-white text-accent font-medium shadow-sm"
                : "text-text-muted hover:bg-white/70 hover:text-text-primary"
            }`}
          >
            <IconGrid className={ICON} />
            Översikt
          </Link>
          <Link
            href="/guide"
            className={`flex items-center gap-2.5 pl-2.5 pr-2.5 py-2 rounded-md text-sm transition-colors ${
              pathname === "/guide"
                ? "bg-white text-accent font-medium shadow-sm"
                : "text-text-muted hover:bg-white/70 hover:text-text-primary"
            }`}
          >
            <IconBook />
            Så testar du Lagkassan
          </Link>
        </div>
      </nav>
    </aside>
  );
}
