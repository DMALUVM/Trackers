"use client";

import { useCallback } from "react";
import { usePullToRefresh } from "@/lib/hooks";
import { PullToRefreshIndicator } from "@/app/app/_components/ui";
import { cacheClear } from "@/lib/clientCache";

/**
 * Layout-level pull-to-refresh that works on ALL pages.
 *
 * On pull: clears the in-memory data cache and dispatches
 * `routines365:routinesChanged` — which useRoutineDay, useStreaks,
 * and other hooks already listen to for automatic reload.
 *
 * Pages that need additional refresh logic can also listen for
 * `routines365:pullRefresh` to do custom work.
 */
export function GlobalPullToRefresh({ children }: { children: React.ReactNode }) {
  const onRefresh = useCallback(async () => {
    // Clear all in-memory caches so fresh data is fetched
    cacheClear();

    // Also clear localStorage caches for routine items & settings
    try {
      localStorage.removeItem("routines365:routineItems");
      localStorage.removeItem("routines365:settings");
    } catch { /* ignore */ }

    // Dispatch events that existing hooks listen to
    window.dispatchEvent(new Event("routines365:routinesChanged"));
    window.dispatchEvent(new Event("routines365:pullRefresh"));

    // Small delay so the spinner shows and data has time to refetch
    await new Promise((r) => setTimeout(r, 600));
  }, []);

  const ptr = usePullToRefresh(onRefresh);

  return (
    <>
      <PullToRefreshIndicator {...ptr} />
      {children}
    </>
  );
}
