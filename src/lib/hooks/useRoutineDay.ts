import { useCallback, useEffect, useRef, useState } from "react";
import type { DayMode, RoutineItemRow } from "@/lib/types";
import { listRoutineItems, loadDayState, toDateKey } from "@/lib/supabaseData";
import { supabase } from "@/lib/supabaseClient";
import { tzIsoDow } from "@/lib/time";
import { isWorkoutLabel } from "@/lib/constants";
import { computeDayColor, type DayColor } from "@/lib/progress";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type UiItem = {
  id: string;
  label: string;
  emoji?: string;
  section: string;
  isNonNegotiable: boolean;
  done: boolean;
};

export type RoutineDayState = {
  items: UiItem[];
  dayMode: DayMode;
  snoozedUntil: Record<string, number>;
  todayColor: DayColor;
  loading: boolean;
  error: string | null;
  /** True if we ended up showing a core-only fallback because nothing was scheduled */
  isFallback: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function shouldShow(item: RoutineItemRow, date: Date, dateKey?: string): boolean {
  // Don't show routines that didn't exist yet on this day
  if (dateKey && item.created_at) {
    const createdDate = item.created_at.slice(0, 10);
    if (createdDate > dateKey) return false;
  }
  const dow = tzIsoDow(date);
  const allowed = item.days_of_week;
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(dow);
}

function toUiItem(ri: RoutineItemRow, done: boolean): UiItem {
  return {
    id: ri.id,
    label: ri.label,
    emoji: ri.emoji ?? undefined,
    section: ri.section,
    isNonNegotiable: ri.is_non_negotiable,
    done,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useRoutineDay(dateKey: string) {
  const today = new Date(dateKey + "T12:00:00");

  const [state, setState] = useState<RoutineDayState>({
    items: [],
    dayMode: "normal",
    snoozedUntil: {},
    todayColor: "empty",
    loading: true,
    error: null,
    isFallback: false,
  });

  // Keep a ref so callers can read the latest items without re-subscribing
  const itemsRef = useRef<UiItem[]>([]);
  const routineItemsRef = useRef<RoutineItemRow[]>([]);

  const load = useCallback(async (isRefresh = false) => {
    // Only show skeleton on initial load, not background refreshes.
    // This prevents the flash: skeleton → content → skeleton → content
    // that happens when onAuthStateChange fires INITIAL_SESSION on mount.
    if (!isRefresh) {
      setState((s) => ({ ...s, loading: true, error: null }));
    }

    try {
      // Wait for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState((s) => ({ ...s, loading: false, error: "Not signed in" }));
        return;
      }

      // Fetch routine items with iOS PWA retry
      let routineItems = await listRoutineItems();
      if (routineItems.length === 0) {
        for (const waitMs of [150, 300, 600]) {
          await new Promise((r) => setTimeout(r, waitMs));
          routineItems = await listRoutineItems();
          if (routineItems.length > 0) break;
        }
      }
      routineItemsRef.current = routineItems;

      if (routineItems.length === 0) {
        setState((s) => ({ ...s, items: [], loading: false, isFallback: false }));
        return;
      }

      // Build baseline (done=false) UI items
      const scheduled = routineItems.filter((ri) => shouldShow(ri, today, dateKey));
      const core = routineItems.filter((ri) => ri.is_non_negotiable && shouldShow(ri, today, dateKey));
      const isFallback = scheduled.length === 0 && core.length > 0;
      const baseItems = (scheduled.length > 0 ? scheduled : core).map((ri) =>
        toUiItem(ri, false)
      );

      // Enrich with saved state
      try {
        const { log, checks, snoozes } = await loadDayState(dateKey);
        const checkMap = new Map(checks.map((c) => [c.routine_item_id, c.done]));
        const enriched = baseItems.map((ri) => ({
          ...ri,
          done: checkMap.get(ri.id) ?? false,
        }));

        const snoozeMap: Record<string, number> = {};
        for (const s of snoozes ?? []) {
          const ms = Date.parse(s.snoozed_until);
          if (!Number.isNaN(ms)) snoozeMap[s.routine_item_id] = ms;
        }

        const activeItems = routineItems.filter((ri) => shouldShow(ri, today, dateKey));
        const color = computeDayColor({
          dateKey,
          routineItems: activeItems.length > 0 ? activeItems : core,
          checks,
          log: log ?? null,
        });

        itemsRef.current = enriched;
        setState({
          items: enriched,
          dayMode: ((log?.day_mode as DayMode) ?? "normal"),
          snoozedUntil: snoozeMap,
          todayColor: color,
          loading: false,
          error: null,
          isFallback,
        });
      } catch {
        // Day state fetch failed — show baseline items with done=false
        itemsRef.current = baseItems;
        setState({
          items: baseItems,
          dayMode: "normal",
          snoozedUntil: {},
          todayColor: "empty",
          loading: false,
          error: null,
          isFallback,
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setState((s) => ({ ...s, loading: false, error: msg }));
    }
  }, [dateKey]);

  // Load on mount, on auth change, on visibility change
  useEffect(() => {
    let cancelled = false;
    let hasLoadedOnce = false;

    const run = () => {
      if (cancelled) return;
      // First load shows skeleton; subsequent loads refresh silently
      void load(hasLoadedOnce);
      hasLoadedOnce = true;
    };

    run();

    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisible);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => run());

    const onRoutinesChanged = () => run();
    window.addEventListener("routines365:routinesChanged", onRoutinesChanged);
    window.addEventListener("routines365:dateChanged", onRoutinesChanged);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      subscription.unsubscribe();
      window.removeEventListener("routines365:routinesChanged", onRoutinesChanged);
      window.removeEventListener("routines365:dateChanged", onRoutinesChanged);
    };
  }, [load]);

  // ---------------------------------------------------------------------------
  // Derived computations
  // ---------------------------------------------------------------------------
  const now = Date.now();
  const activeSnoozed = (id: string) =>
    state.snoozedUntil[id] != null && state.snoozedUntil[id] > now;

  const coreItems = state.items.filter((i) => i.isNonNegotiable && !activeSnoozed(i.id));
  const optionalItems = state.items.filter((i) => !i.isNonNegotiable && !activeSnoozed(i.id));

  const didRowing = state.items.some((i) => i.label.toLowerCase().includes("rowing") && i.done);
  const didWeights = state.items.some((i) => i.label.toLowerCase().includes("workout") && i.done);

  const missingCore = coreItems.filter((i) => {
    if (isWorkoutLabel(i.label)) return !(i.done || didRowing || didWeights);
    return !i.done;
  });

  const coreDone = coreItems.filter((i) => i.done).length;
  const coreTotal = coreItems.length;
  const optionalDone = optionalItems.filter((i) => i.done).length;
  const score = coreTotal === 0 ? 0 : Math.round((coreDone / coreTotal) * 100);

  const immediateColor: DayColor =
    coreTotal === 0 ? "empty" : missingCore.length === 0 ? "green" : missingCore.length === 1 ? "yellow" : "red";

  const allCoreDone = coreTotal > 0 && missingCore.length === 0;

  return {
    ...state,
    itemsRef,
    routineItemsRef,
    reload: () => load(true),

    // Derived
    coreItems,
    optionalItems,
    missingCore,
    coreDone,
    coreTotal,
    optionalDone,
    score,
    immediateColor,
    allCoreDone,
    didRowing,
    didWeights,
    activeSnoozed,
  };
}
