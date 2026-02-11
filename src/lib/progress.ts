import { endOfWeek, parseISO, startOfWeek } from "date-fns";
import type { DailyLogRow, RoutineItemRow } from "@/lib/types";

export type DayColor = "green" | "yellow" | "red" | "empty";

import { isWorkoutLabel, isRowingLabel, isWeightsLabel } from "@/lib/constants";

// Re-export from constants for backward compat
export { isWorkoutLabel, isRowingLabel, isWeightsLabel };

/**
 * Get ISO day of week (1=Mon..7=Sun) from a date key.
 * Uses midday to avoid UTC-to-local date rollover issues.
 */
function isoDow(dateKey: string): number {
  // Parse as local midday to avoid timezone-induced date shift
  const d = new Date(dateKey + "T12:00:00");
  const jsDay = d.getDay(); // 0=Sun..6=Sat
  return jsDay === 0 ? 7 : jsDay; // Convert to 1=Mon..7=Sun
}

/**
 * Check if a routine item should show on a given day
 * based on its days_of_week schedule.
 */
function isScheduledForDay(item: RoutineItemRow, dateKey: string): boolean {
  if (!item.days_of_week || item.days_of_week.length === 0) return true;
  return item.days_of_week.includes(isoDow(dateKey));
}

/**
 * Compute the color for a calendar day.
 *
 * CRITICAL FIX: Days in the future or before the user created their
 * account MUST return "empty". Showing red for days that haven't
 * happened yet (or before the user existed) is a mood-killer —
 * it makes the entire calendar look like failure on day 1.
 *
 * @param opts.todayKey    - today's date key (YYYY-MM-DD)
 * @param opts.accountStartKey - date the user created their account (YYYY-MM-DD), or null to skip check
 */
export function computeDayColor(opts: {
  dateKey: string;
  routineItems: RoutineItemRow[];
  checks: Array<{ routine_item_id: string; done: boolean }>;
  log: DailyLogRow | null;
  todayKey?: string;
  accountStartKey?: string | null;
}): DayColor {
  const { dateKey, checks, log, todayKey, accountStartKey } = opts;
  const routineItems = opts.routineItems;

  // ── Guard: future days are always empty ──
  if (todayKey && dateKey > todayKey) return "empty";

  // ── Guard: days before account creation are empty — UNLESS user saved data ──
  if (accountStartKey && dateKey < accountStartKey && checks.length === 0) return "empty";

  // ── Travel / Sick day mode = automatic green ──
  if (log && (log.day_mode === "travel" || log.day_mode === "sick")) return "green";

  const checkMap = new Map(checks.map((c) => [c.routine_item_id, c.done]));

  // ── Guard: if user never interacted this day (zero checks), show empty ──
  if (checks.length === 0 && dateKey !== todayKey) return "empty";

  // ── Guard: if all checks are unchecked, treat as no data ──
  if (!checks.some((c) => c.done) && dateKey !== todayKey) return "empty";

  // ── Filter routine items by day-of-week schedule ──
  const scheduledItems = routineItems.filter((i) => isScheduledForDay(i, dateKey));

  // ── CRITICAL: For past days, only evaluate routines that have a check record ──
  // This prevents newly added routines from turning old green days red.
  // A routine added today has no check records for past days, so it's excluded.
  // For today, evaluate all scheduled routines (user needs to see what to do).
  const isPast = todayKey && dateKey < todayKey;
  const idsWithChecks = new Set(checks.map((c) => c.routine_item_id));
  const evaluatable = isPast
    ? scheduledItems.filter((i) => idsWithChecks.has(i.id))
    : scheduledItems;

  const nonnegs = evaluatable.filter((i) => i.is_non_negotiable);
  if (nonnegs.length === 0) return "empty";

  const didRowing = !!log?.did_rowing;
  const didWeights = !!log?.did_weights;

  // Also check if any check with rowing or weights label is done
  const labelDoneCheck = (testFn: (label: string) => boolean) => {
    for (const ri of scheduledItems) {
      if (testFn(ri.label) && (checkMap.get(ri.id) ?? false)) {
        return true;
      }
    }
    return false;
  };

  const anyRowing = didRowing || labelDoneCheck(isRowingLabel);
  const anyWeights = didWeights || labelDoneCheck(isWeightsLabel);

  let missed = 0;
  for (const item of nonnegs) {
    const checked = checkMap.get(item.id) ?? false;

    if (isWorkoutLabel(item.label)) {
      if (!(checked || anyRowing || anyWeights)) missed += 1;
      continue;
    }

    if (!checked) missed += 1;
  }

  if (missed === 0) return "green";
  if (missed === 1) return "yellow";
  return "red";
}

export function weekBounds(now: Date) {
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });
  return { start, end };
}

export function inRange(dateKey: string, from: Date, to: Date) {
  const d = parseISO(dateKey);
  return d >= from && d <= to;
}

/** Format a Date as YYYY-MM-DD in local time (not UTC). */
function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function countWeeklyMetric(opts: {
  logs: DailyLogRow[];
  now: Date;
  metric: "rowing" | "neuro";
}) {
  const { start, end } = weekBounds(opts.now);
  const fromKey = toLocalDateKey(start);
  const toKey = toLocalDateKey(end);

  if (opts.metric === "rowing") {
    return opts.logs.filter(
      (l) => l.date >= fromKey && l.date <= toKey && !!l.did_rowing
    ).length;
  }

  return 0;
}
