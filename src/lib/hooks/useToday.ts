import { useCallback, useEffect, useState } from "react";
import { toDateKey } from "@/lib/supabaseData";

/**
 * Returns the current date and dateKey, and automatically updates at midnight.
 * Fixes the bug where useMemo(() => new Date(), []) caches the date forever.
 */
export function useToday() {
  const [today, setToday] = useState(() => new Date());
  const [dateKey, setDateKey] = useState(() => toDateKey(new Date()));

  const refresh = useCallback(() => {
    const now = new Date();
    const dk = toDateKey(now);
    setToday(now);
    setDateKey(dk);
    return dk;
  }, []);

  useEffect(() => {
    // Refresh on visibility change (covers waking up the phone the next day)
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const prevDk = dateKey;
      const nextDk = refresh();
      // If the date changed, we'll re-render with the new date
      if (prevDk !== nextDk) {
        window.dispatchEvent(new Event("routines365:dateChanged"));
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    // Also set a timeout for midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    const timer = setTimeout(() => {
      refresh();
      window.dispatchEvent(new Event("routines365:dateChanged"));
    }, msUntilMidnight + 1000); // +1s buffer

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearTimeout(timer);
    };
  }, [dateKey, refresh]);

  return { today, dateKey, refresh };
}
