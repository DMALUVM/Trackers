import { useEffect, useState } from "react";
import { format, subDays, startOfMonth, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import type { DayColor } from "@/lib/progress";
import { computeDayColor } from "@/lib/progress";
import { loadRangeStates, listRoutineItems } from "@/lib/supabaseData";
import { tzIsoDow } from "@/lib/time";
import type { RoutineItemRow } from "@/lib/types";
import { CATEGORY_KEYWORDS, STREAK_LOOKBACK_DAYS } from "@/lib/constants";

function shouldShow(item: RoutineItemRow, date: Date): boolean {
  const dow = tzIsoDow(date);
  const allowed = item.days_of_week;
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(dow);
}

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  last7Days: Array<{ dateKey: string; color: DayColor }>;
  categoryStreaks: { movement: number; mind: number; sleep: number };
  /** Green days in the current calendar month (up to today). */
  greenDaysThisMonth: number;
  /** Core habit hit-rate for the current ISO week (0–100). */
  coreHitRateThisWeek: number | null;
  /** Total green days across all history. */
  totalGreenDays: number;
  /** Number of days since the last green day (0 = today or yesterday was green). */
  daysSinceLastGreen: number;
  /** Green days in the current week (Mon–Sun). */
  greenDaysThisWeek: number;
  /** Green days in last week (for trend comparison). */
  greenDaysLastWeek: number;
  /** Previous best streak before current one (for personal best detection). */
  previousBestStreak: number;
  loading: boolean;
}

/**
 * Loads history and computes streaks. Deferred after first paint so it
 * doesn't block the main Today UI from rendering.
 */
export function useStreaks(dateKey: string) {
  const [data, setData] = useState<StreakData>({
    currentStreak: 0,
    bestStreak: 0,
    last7Days: [],
    categoryStreaks: { movement: 0, mind: 0, sleep: 0 },
    greenDaysThisMonth: 0,
    coreHitRateThisWeek: null,
    totalGreenDays: 0,
    daysSinceLastGreen: 999,
    greenDaysThisWeek: 0,
    greenDaysLastWeek: 0,
    previousBestStreak: 0,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    // Defer heavy computation until after paint
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const today = new Date(dateKey + "T12:00:00");
          const from = format(subDays(today, STREAK_LOOKBACK_DAYS), "yyyy-MM-dd");

          const [routineItems, hist] = await Promise.all([
            listRoutineItems(),
            loadRangeStates({ from, to: dateKey }),
          ]);

          if (cancelled) return;

          // Get account creation date so pre-account days don't count as red
          let accountStartKey: string | null = null;
          try {
            const { supabase } = await import("@/lib/supabaseClient");
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user?.created_at) {
              accountStartKey = userData.user.created_at.slice(0, 10);
            }
          } catch { /* ignore */ }

          // Build lookup maps
          const checksByDate = new Map<string, Array<{ routine_item_id: string; done: boolean }>>();
          for (const c of hist.checks) {
            const arr = checksByDate.get(c.date) ?? [];
            arr.push({ routine_item_id: c.routine_item_id, done: c.done });
            checksByDate.set(c.date, arr);
          }
          const logMap = new Map<string, (typeof hist.logs)[number]>();
          for (const l of hist.logs) logMap.set(l.date, l);

          const labelById = new Map(
            routineItems.map((ri) => [ri.id, (ri.label ?? "").toLowerCase()])
          );

          // Compute color for each day
          const histDays: Array<{ dateKey: string; color: DayColor }> = [];
          for (let i = STREAK_LOOKBACK_DAYS; i >= 0; i--) {
            const dk = format(subDays(today, i), "yyyy-MM-dd");
            const d = new Date(dk + "T12:00:00");
            const active = routineItems.filter((ri) => shouldShow(ri, d));
            const color = computeDayColor({
              dateKey: dk,
              routineItems: active,
              checks: checksByDate.get(dk) ?? [],
              log: logMap.get(dk) ?? null,
              todayKey: dateKey,
              accountStartKey,
            });
            histDays.push({ dateKey: dk, color });
          }

          // Current streak (consecutive green from today backward)
          let currentStreak = 0;
          for (let i = histDays.length - 1; i >= 0; i--) {
            if (histDays[i].color !== "green") break;
            currentStreak++;
          }

          // Best streak and previous-best tracking
          let bestStreak = 0;
          let run = 0;
          const completedStreaks: number[] = [];
          for (const d of histDays) {
            if (d.color === "green") {
              run++;
              if (run > bestStreak) bestStreak = run;
            } else {
              if (run > 0) completedStreaks.push(run);
              run = 0;
            }
          }
          // If current streak is the best, previous best is the second-best
          const previousBestStreak = (() => {
            const allStreaks = [...completedStreaks].sort((a, b) => b - a);
            if (currentStreak >= bestStreak) {
              // The best IS the current; find the next best from completed
              return allStreaks.length > 0 ? allStreaks[0] : 0;
            }
            return bestStreak;
          })();

          // Total green days
          let totalGreenDays = 0;
          for (const d of histDays) {
            if (d.color === "green") totalGreenDays++;
          }

          // Days since last green (before today)
          let daysSinceLastGreen = 999;
          for (let i = histDays.length - 1; i >= 0; i--) {
            if (histDays[i].color === "green") {
              daysSinceLastGreen = histDays.length - 1 - i;
              break;
            }
          }

          // Category streaks
          const didCategory = (dk: string, keywords: readonly string[]) => {
            const cs = checksByDate.get(dk) ?? [];
            for (const c of cs) {
              if (!c.done) continue;
              const lbl = labelById.get(c.routine_item_id) ?? "";
              if (keywords.some((k) => lbl.includes(k))) return true;
            }
            return false;
          };

          const streakFor = (keywords: readonly string[]) => {
            let s = 0;
            for (let i = histDays.length - 1; i >= 0; i--) {
              if (!didCategory(histDays[i].dateKey, keywords)) break;
              s++;
            }
            return s;
          };

          if (cancelled) return;

          // Green days this month
          const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
          let greenDaysThisMonth = 0;
          for (const d of histDays) {
            if (d.dateKey >= monthStart && d.color === "green") greenDaysThisMonth++;
          }

          // Green days this week vs last week
          const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
          const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
          const lastWeekStart = format(startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }), "yyyy-MM-dd");
          const lastWeekEnd = format(endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }), "yyyy-MM-dd");

          let greenDaysThisWeek = 0;
          let greenDaysLastWeek = 0;
          for (const d of histDays) {
            if (d.dateKey >= weekStart && d.dateKey <= weekEnd && d.color === "green") greenDaysThisWeek++;
            if (d.dateKey >= lastWeekStart && d.dateKey <= lastWeekEnd && d.color === "green") greenDaysLastWeek++;
          }

          // Core hit-rate this week
          const coreIds = new Set(
            routineItems.filter((ri) => ri.is_non_negotiable).map((ri) => ri.id)
          );
          let weekTotal = 0;
          let weekDone = 0;
          for (const [dk, cs] of checksByDate) {
            if (dk < weekStart || dk > weekEnd) continue;
            for (const c of cs) {
              if (!coreIds.has(c.routine_item_id)) continue;
              weekTotal++;
              if (c.done) weekDone++;
            }
          }
          const coreHitRateThisWeek = weekTotal === 0 ? 0 : Math.round((weekDone / weekTotal) * 100);

          setData({
            currentStreak,
            bestStreak,
            last7Days: histDays.slice(-7),
            categoryStreaks: {
              movement: streakFor(CATEGORY_KEYWORDS.movement),
              mind: streakFor(CATEGORY_KEYWORDS.mind),
              sleep: streakFor(CATEGORY_KEYWORDS.sleep),
            },
            greenDaysThisMonth,
            coreHitRateThisWeek,
            totalGreenDays,
            daysSinceLastGreen,
            greenDaysThisWeek,
            greenDaysLastWeek,
            previousBestStreak,
            loading: false,
          });
        } catch {
          if (!cancelled) {
            setData((s) => ({ ...s, loading: false }));
          }
        }
      })();
    }, 50); // Small delay to let the UI render first

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [dateKey]);

  return data;
}
