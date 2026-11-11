"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconGrid, IconPlus, IconUsers } from "@/components/icons";

type Team = { id: string; name: string };

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
          <IconGrid className="w-5 h-5" />
          <span>Översikt</span>
        </Link>

        <Link
          href={teamHref}
          className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
            isTeam ? "text-accent" : "text-text-muted"
          }`}
        >
          <IconUsers className="w-5 h-5" />
          <span>Lag</span>
        </Link>

        <Link
          href="/collections/new"
          className="flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium text-text-muted transition-colors hover:text-accent"
        >
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center -mt-4 shadow-md">
            <IconPlus className="w-5 h-5 text-white" />
          </div>
          <span className="mt-0.5">Ny</span>
        </Link>
      </div>
    </nav>
  );
}
