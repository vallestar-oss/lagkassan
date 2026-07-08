"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Lightweight polling so organizers see updated payment statuses without a
// manual browser refresh. router.refresh() re-fetches the current route's
// server data in place — no full page reload, no visible flash.
//
// Paused while the tab is in the background (Page Visibility API) — nobody's
// watching a hidden tab, so there's no point spending requests on it. When
// the tab becomes visible again, refresh immediately rather than waiting up
// to a full interval, since data may be stale from time spent away.
const POLL_INTERVAL_MS = 12000;

export function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (id !== null) return;
      id = setInterval(() => router.refresh(), POLL_INTERVAL_MS);
    }

    function stop() {
      if (id === null) return;
      clearInterval(id);
      id = null;
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        stop();
      } else {
        router.refresh();
        start();
      }
    }

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null;
}
