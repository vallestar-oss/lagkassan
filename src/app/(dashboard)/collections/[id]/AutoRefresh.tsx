"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Lightweight polling so the organizer sees a member's public payment report
// without a manual browser refresh. router.refresh() re-fetches the current
// route's server data in place — no full page reload, no visible flash.
const POLL_INTERVAL_MS = 12000;

export function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
