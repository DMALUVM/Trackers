import { useCallback, useEffect, useState } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { sumActivity, type ActivityKey, type ActivityUnit } from "@/lib/activity";

export interface ActivityTotals {
  wtd: number;
  mtd: number;
  ytd: number;
  all: number;
}

export interface UseActivityTotalsResult {
  totals: ActivityTotals;
  loading: boolean;
  reload: () => void;
}

/**
 * Fetches WTD/MTD/YTD/All-time sums for a given activity+unit.
 */
export function useActivityTotals(activityKey: ActivityKey, unit: ActivityUnit): UseActivityTotalsResult {
  const [totals, setTotals] = useState<ActivityTotals>({ wtd: 0, mtd: 0, ytd: 0, all: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
      const yearStart = format(startOfYear(now), "yyyy-MM-dd");
      const yearEnd = format(endOfYear(now), "yyyy-MM-dd");

      const [wtd, mtd, ytd, all] = await Promise.all([
        sumActivity({ from: weekStart, to: weekEnd, activityKey, unit }),
        sumActivity({ from: monthStart, to: monthEnd, activityKey, unit }),
        sumActivity({ from: yearStart, to: yearEnd, activityKey, unit }),
        sumActivity({ from: "2020-01-01", to: "2099-12-31", activityKey, unit }),
      ]);

      setTotals({ wtd, mtd, ytd, all });
    } catch {
      // Silently handle — totals stay at 0
    } finally {
      setLoading(false);
    }
  }, [activityKey, unit]);

  useEffect(() => { void load(); }, [load]);

  // Reload when an activity is logged
  useEffect(() => {
    const onLogged = () => { void load(); };
    window.addEventListener("routines365:activityLogged", onLogged);
    return () => window.removeEventListener("routines365:activityLogged", onLogged);
  }, [load]);

  return { totals, loading, reload: load };
}

/**
 * Fetches totals for multiple activity+unit pairs in a single hook.
 * Pass a stable JSON-serialisable key array (e.g. from a constant).
 */
export interface MultiTotalsEntry { activityKey: ActivityKey; unit: ActivityUnit; label: string }

export function useMultiActivityTotals(entries: MultiTotalsEntry[]) {
  const [data, setData] = useState<Record<string, ActivityTotals>>({});
  const [loading, setLoading] = useState(true);

  // Stable serialisation key
  const stableKey = entries.map((e) => `${e.activityKey}:${e.unit}`).join(",");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
      const yearStart = format(startOfYear(now), "yyyy-MM-dd");
      const yearEnd = format(endOfYear(now), "yyyy-MM-dd");

      const results: Record<string, ActivityTotals> = {};
      await Promise.all(
        entries.map(async (entry) => {
          const key = `${entry.activityKey}:${entry.unit}`;
          const [wtd, mtd, ytd, all] = await Promise.all([
            sumActivity({ from: weekStart, to: weekEnd, activityKey: entry.activityKey, unit: entry.unit }),
            sumActivity({ from: monthStart, to: monthEnd, activityKey: entry.activityKey, unit: entry.unit }),
            sumActivity({ from: yearStart, to: yearEnd, activityKey: entry.activityKey, unit: entry.unit }),
            sumActivity({ from: "2020-01-01", to: "2099-12-31", activityKey: entry.activityKey, unit: entry.unit }),
          ]);
          results[key] = { wtd, mtd, ytd, all };
        })
      );

      setData(results);
    } catch {
      // stay at defaults
    } finally {
      setLoading(false);
    }
  }, [stableKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void load(); }, [load]);

  // Reload when an activity is logged
  useEffect(() => {
    const onLogged = () => { void load(); };
    window.addEventListener("routines365:activityLogged", onLogged);
    return () => window.removeEventListener("routines365:activityLogged", onLogged);
  }, [load]);

  return { data, loading, reload: load };
}
