"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Team = { id: string; name: string };

function IconGrid() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

export function MobileNav({ teams }: { teams: Team[] }) {
  const pathname = usePathname();

  const teamHref = teams.length > 0 ? `/teams/${teams[0].id}` : "/teams/new";
  const isTeam = pathname.startsWith("/teams");
  const isOverview = pathname === "/dashboard";

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-shell border-t border-surface-border">
      <div className="flex items-stretch h-16 safe-area-inset-bottom">
        <Link
          href="/dashboard"
          className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
            isOverview ? "text-accent" : "text-text-muted"
          }`}
        >
          <IconGrid />
          <span>Översikt</span>
        </Link>

        <Link
          href={teamHref}
          className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
            isTeam ? "text-accent" : "text-text-muted"
          }`}
        >
          <IconUsers />
          <span>Lag</span>
        </Link>

        <Link
          href="/collections/new"
          className="flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium text-text-muted transition-colors hover:text-accent"
        >
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center -mt-4 shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <span className="mt-0.5">Ny</span>
        </Link>
      </div>
    </nav>
  );
}
