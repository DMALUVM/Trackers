import { useEffect, useState } from "react";
import { format, subDays, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { loadRangeStates, listRoutineItems } from "@/lib/supabaseData";
import type { RoutineItemRow } from "@/lib/types";

const LOOKBACK_DAYS = 400; // ~13 months for YTD

export interface HabitStreak {
  id: string;
  label: string;
  emoji: string | null;
  isCore: boolean;
  /** Consecutive days completed (from today backward, skips today if not done) */
  currentStreak: number;
  bestStreak: number;
  /** Completions this week (Mon–Sun) */
  wtd: number;
  /** Completions this month */
  mtd: number;
  /** Completions this year */
  ytd: number;
  /** All-time completions (within lookback window) */
  allTime: number;
  /** Total days the habit was active (for completion %) */
  totalTracked: number;
  /** Completion rate 0–100 */
  completionPct: number;
  /** Last 30 days: true = done */
  last30: boolean[];
  /** Per-habit milestone IDs earned */
  earnedMilestones: string[];
  /** Next milestone threshold */
  nextMilestoneAt: number | null;
}

const HABIT_MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365];

export function useHabitStreaks(dateKey: string) {
  const [habits, setHabits] = useState<HabitStreak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const today = new Date(dateKey + "T12:00:00");
        const from = format(subDays(today, LOOKBACK_DAYS), "yyyy-MM-dd");
        const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
        const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
        const yearStart = format(startOfYear(today), "yyyy-MM-dd");

        const [routineItems, hist] = await Promise.all([
          listRoutineItems(),
          loadRangeStates({ from, to: dateKey }),
        ]);

        if (cancelled) return;

        // Build per-habit check maps
        // Map<habitId, Set<dateKey>> of completed dates
        const doneByHabit = new Map<string, Set<string>>();
        // Map<habitId, Set<dateKey>> of all dates the habit had a check record
        const trackedByHabit = new Map<string, Set<string>>();

        for (const c of hist.checks) {
          if (!trackedByHabit.has(c.routine_item_id)) {
            trackedByHabit.set(c.routine_item_id, new Set());
          }
          trackedByHabit.get(c.routine_item_id)!.add(c.date);

          if (c.done) {
            if (!doneByHabit.has(c.routine_item_id)) {
              doneByHabit.set(c.routine_item_id, new Set());
            }
            doneByHabit.get(c.routine_item_id)!.add(c.date);
          }
        }

        // Compute stats for each active habit
        const results: HabitStreak[] = [];

        for (const item of routineItems) {
          if (!item.is_active) continue;

          const doneSet = doneByHabit.get(item.id) ?? new Set();
          const trackedSet = trackedByHabit.get(item.id) ?? new Set();

          // Current streak (from today backward, skip today if not done)
          let currentStreak = 0;
          let startIdx = 0;
          // If today isn't done, start from yesterday
          if (!doneSet.has(dateKey)) startIdx = 1;
          for (let i = startIdx; i <= LOOKBACK_DAYS; i++) {
            const dk = format(subDays(today, i), "yyyy-MM-dd");
            // Only count days the habit was tracked
            if (!trackedSet.has(dk)) {
              // If never tracked on this day, skip (don't break)
              // But if we already have a streak going, this day didn't exist so continue
              if (currentStreak === 0) continue;
              // If the habit didn't exist this far back, stop
              break;
            }
            if (doneSet.has(dk)) {
              currentStreak++;
            } else {
              break;
            }
          }

          // Best streak
          let bestStreak = 0;
          let run = 0;
          // Sort tracked dates
          const allDates = [...trackedSet].sort();
          for (const dk of allDates) {
            if (doneSet.has(dk)) {
              run++;
              if (run > bestStreak) bestStreak = run;
            } else {
              run = 0;
            }
          }

          // Period counts
          let wtd = 0, mtd = 0, ytd = 0, allTime = 0;
          for (const dk of doneSet) {
            allTime++;
            if (dk >= yearStart) ytd++;
            if (dk >= monthStart) mtd++;
            if (dk >= weekStart) wtd++;
          }

          // Completion %
          const totalTracked = trackedSet.size;
          const completionPct = totalTracked > 0 ? Math.round((allTime / totalTracked) * 100) : 0;

          // Last 30 days
          const last30: boolean[] = [];
          for (let i = 29; i >= 0; i--) {
            const dk = format(subDays(today, i), "yyyy-MM-dd");
            last30.push(doneSet.has(dk));
          }

          // Milestones
          const earnedMilestones = HABIT_MILESTONES
            .filter(t => currentStreak >= t || bestStreak >= t)
            .map(t => `habit-${item.id}-${t}`);

          const nextMilestoneAt = HABIT_MILESTONES.find(t => t > currentStreak) ?? null;

          results.push({
            id: item.id,
            label: item.label,
            emoji: item.emoji,
            isCore: item.is_non_negotiable,
            currentStreak,
            bestStreak,
            wtd,
            mtd,
            ytd,
            allTime,
            totalTracked,
            completionPct,
            last30,
            earnedMilestones,
            nextMilestoneAt,
          });
        }

        // Sort: pinned first, then by streak descending
        const pinned = getPinnedHabits();
        results.sort((a, b) => {
          const aPinned = pinned.has(a.id) ? 0 : 1;
          const bPinned = pinned.has(b.id) ? 0 : 1;
          if (aPinned !== bPinned) return aPinned - bPinned;
          return b.currentStreak - a.currentStreak;
        });

        if (!cancelled) {
          setHabits(results);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [dateKey]);

  return { habits, loading };
}

// ── Pinned Habits (localStorage) ──

const LS_PINNED = "routines365:pinnedStreaks";

export function getPinnedHabits(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_PINNED);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

export function togglePinHabit(id: string): boolean {
  const pinned = getPinnedHabits();
  if (pinned.has(id)) {
    pinned.delete(id);
  } else {
    if (pinned.size >= 5) return false; // max 5 pinned
    pinned.add(id);
  }
  try { localStorage.setItem(LS_PINNED, JSON.stringify([...pinned])); } catch {}
  return true;
}
