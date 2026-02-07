import { endOfWeek, parseISO, startOfWeek } from "date-fns";
import type { DailyLogRow, RoutineItemRow } from "@/lib/types";

export type DayColor = "green" | "yellow" | "red" | "empty";

// Re-export from constants for backward compat
export { isWorkoutLabel } from "@/lib/constants";

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
  const { dateKey, routineItems, checks, log, todayKey, accountStartKey } = opts;

  // ── Guard: future days are always empty ──
  if (todayKey && dateKey > todayKey) return "empty";

  // ── Guard: days before account creation are empty ──
  if (accountStartKey && dateKey < accountStartKey) return "empty";

  const checkMap = new Map(checks.map((c) => [c.routine_item_id, c.done]));

  const nonnegs = routineItems.filter((i) => i.is_non_negotiable);
  if (nonnegs.length === 0) return "empty";

  const didRowing = !!log?.did_rowing;
  const didWeights = !!log?.did_weights;

  // Also check if any check with "rowing" or "workout" in label is done
  const labelDoneCheck = (keyword: string) => {
    for (const ri of routineItems) {
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
