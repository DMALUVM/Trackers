import { parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import type { DailyLogRow, RoutineItemRow } from "@/lib/types";

export type DayColor = "green" | "yellow" | "red" | "empty";

export function isWorkoutLabel(label: string) {
  return label.toLowerCase().includes("workout");
}

export function computeDayColor(opts: {
  dateKey: string;
  routineItems: RoutineItemRow[];
  checks: Array<{ routine_item_id: string; done: boolean }>;
  log: DailyLogRow | null;
}): DayColor {
  const { routineItems, checks, log } = opts;
  const checkMap = new Map(checks.map((c) => [c.routine_item_id, c.done]));

  const nonnegs = routineItems.filter((i) => i.is_non_negotiable);
  if (nonnegs.length === 0) return "empty";

  // Workout special case: satisfied if weights OR rowing (or the workout item is checked)
  const didRowing = !!log?.did_rowing;
  const didWeights = !!log?.did_weights;

  let missed = 0;
  for (const item of nonnegs) {
    if (isWorkoutLabel(item.label)) {
      const checked = checkMap.get(item.id) ?? false;
      const ok = checked || didRowing || didWeights;
      if (!ok) missed += 1;
      continue;
    }

    const ok = checkMap.get(item.id) ?? false;
    if (!ok) missed += 1;
  }

  if (missed === 0) return "green";
  if (missed === 1) return "yellow";
  return "red";
}

export function inCurrentWeek(dateKey: string, now = new Date()) {
  const d = parseISO(dateKey);
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });
  return d >= start && d <= end;
}

export function inCurrentMonth(dateKey: string, now = new Date()) {
  const d = parseISO(dateKey);
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  return d >= start && d <= end;
}
