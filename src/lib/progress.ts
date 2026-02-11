import { endOfWeek, parseISO, startOfWeek } from "date-fns";
import type { DailyLogRow, RoutineItemRow } from "@/lib/types";

export type DayColor = "green" | "yellow" | "red" | "empty";

// Re-export from constants for backward compat
export { isWorkoutLabel } from "@/lib/constants";

/**
 * Get ISO day of week (1=Mon..7=Sun) from a date.
 * Doesn't need timezone — dateKey parsing is always midnight local.
 */
function isoDow(dateKey: string): number {
  const d = parseISO(dateKey);
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

  // ── Filter out routines that didn't exist yet on this day ──
  // A routine added on Feb 11 should NOT count as missed on Feb 8.
  const routineItems = opts.routineItems.filter((ri) => {
    try {
      if (!ri.created_at) return true; // legacy items without timestamp
      const createdDate = ri.created_at.slice(0, 10);
      return createdDate <= dateKey;
    } catch {
      return true; // if anything goes wrong, include the item
    }
  });

  // ── Guard: future days are always empty ──
  if (todayKey && dateKey > todayKey) return "empty";

  // ── Guard: days before account creation are empty — UNLESS user saved data ──
  // This prevents a wall of red on new accounts, but allows backfilled days to show color.
  if (accountStartKey && dateKey < accountStartKey && checks.length === 0) return "empty";

  // ── Travel / Sick day mode = automatic green ──
  // The user explicitly set this day as travel or sick, meaning they
  // chose to rest. This MUST count as green to protect their streak.
  if (log && (log.day_mode === "travel" || log.day_mode === "sick")) return "green";

  const checkMap = new Map(checks.map((c) => [c.routine_item_id, c.done]));

  // ── Guard: if user never interacted this day (zero checks), show empty ──
  if (checks.length === 0 && dateKey !== todayKey) return "empty";

  // ── Guard: if all checks are unchecked, treat as no data ──
  // This prevents phantom records (e.g. from auto-save bugs) from coloring days
  if (!checks.some((c) => c.done) && dateKey !== todayKey) return "empty";

  // ── Filter routine items by day-of-week schedule ──
  // A habit scheduled for M/W/F should NOT count as missed on Tuesday.
  // This matches the Today page behavior (shouldShow filter).
  const scheduledItems = routineItems.filter((i) => isScheduledForDay(i, dateKey));

  const nonnegs = scheduledItems.filter((i) => i.is_non_negotiable);
  if (nonnegs.length === 0) return "empty";

  const didRowing = !!log?.did_rowing;
  const didWeights = !!log?.did_weights;

  // Also check if any check with "rowing" or "workout" in label is done
  const labelDoneCheck = (keyword: string) => {
    for (const ri of scheduledItems) {
      if (ri.label.toLowerCase().includes(keyword) && (checkMap.get(ri.id) ?? false)) {
        return true;
      }
    }
    return false;
  };

  const anyRowing = didRowing || labelDoneCheck("rowing");
  const anyWeights = didWeights || labelDoneCheck("workout");

  let missed = 0;
  for (const item of nonnegs) {
    const lbl = item.label.toLowerCase();
    const checked = checkMap.get(item.id) ?? false;

    if (lbl.includes("workout") || lbl.includes("exercise")) {
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

export function countWeeklyMetric(opts: {
  logs: DailyLogRow[];
  now: Date;
  metric: "rowing" | "neuro";
}) {
  const { start, end } = weekBounds(opts.now);
  const fromKey = start.toISOString().slice(0, 10);
  const toKey = end.toISOString().slice(0, 10);

  if (opts.metric === "rowing") {
    return opts.logs.filter(
      (l) => l.date >= fromKey && l.date <= toKey && !!l.did_rowing
    ).length;
  }

  return 0;
}
