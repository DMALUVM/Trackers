"use client";

import { useEffect, useState, useCallback } from "react";
import { subDays } from "date-fns";
import { Calendar } from "lucide-react";
import { BottomSheet } from "@/app/app/_components/ui";
import { loadRangeStates, toDateKey, listRoutineItems, updateRoutineItem } from "@/lib/supabaseData";
import { usePremium, PREMIUM_FEATURES } from "@/lib/premium";
import { PremiumGate } from "@/app/app/_components/PremiumGate";
import { hapticLight } from "@/lib/haptics";

interface HabitDetailSheetProps {
  open: boolean;
  onClose: () => void;
  habit: { id: string; label: string; emoji: string | null; isCore: boolean } | null;
}

type HabitStats = {
  completionRate: number;
  totalDone: number;
  totalTracked: number;
  currentStreak: number;
  bestStreak: number;
  bestDay: string;
  worstDay: string;
  last14: Array<{ dateKey: string; done: boolean }>;
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function HabitDetailSheet({ open, onClose, habit }: HabitDetailSheetProps) {
  const { hasFeature } = usePremium();
  const [stats, setStats] = useState<HabitStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !habit) return;
    if (!hasFeature(PREMIUM_FEATURES.habitDetailStats)) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      const now = new Date();
      const today = toDateKey(now);
      const from = toDateKey(subDays(now, 59));

      const { checks } = await loadRangeStates({ from, to: today });
      const habitChecks = checks.filter(c => c.routine_item_id === habit.id);

      // Active dates (days user was active)
      const activeDates = new Set(checks.map(c => c.date));

      // Completion by day
      const doneSet = new Set(habitChecks.filter(c => c.done).map(c => c.date));
      const totalTracked = [...activeDates].filter(d => d <= today).length;
      const totalDone = [...doneSet].length;
      const completionRate = totalTracked > 0 ? Math.round((totalDone / totalTracked) * 100) : 0;

      // Current streak
      let currentStreak = 0;
      for (let i = 0; i < 60; i++) {
        const dk = toDateKey(subDays(now, i));
        if (!activeDates.has(dk)) continue;
        if (doneSet.has(dk)) currentStreak++;
        else break;
      }

      // Best streak
      const sorted = [...activeDates].sort();
      let bestStreak = 0, tempStreak = 0;
      for (const dk of sorted) {
        if (doneSet.has(dk)) {
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }

      // Day-of-week analysis
      const dowDone = Array(7).fill(0);
      const dowTotal = Array(7).fill(0);
      for (const dk of activeDates) {
        const dow = new Date(dk + "T12:00:00").getDay();
        dowTotal[dow]++;
        if (doneSet.has(dk)) dowDone[dow]++;
      }

      let bestDow = 0, worstDow = 0, bestPct = -1, worstPct = 101;
      for (let i = 0; i < 7; i++) {
        if (dowTotal[i] < 2) continue;
        const pct = Math.round((dowDone[i] / dowTotal[i]) * 100);
        if (pct > bestPct) { bestPct = pct; bestDow = i; }
        if (pct < worstPct) { worstPct = pct; worstDow = i; }
      }

      // Last 14 days
      const last14 = Array.from({ length: 14 }).map((_, i) => {
        const dk = toDateKey(subDays(now, 13 - i));
        return { dateKey: dk, done: doneSet.has(dk) };
      });

      if (!cancelled) {
        setStats({
          completionRate,
          totalDone,
          totalTracked,
          currentStreak,
          bestStreak,
          bestDay: DAY_NAMES[bestDow],
          worstDay: DAY_NAMES[worstDow],
          last14,
        });
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, habit, hasFeature]);

  if (!habit) return null;

  const isPremium = hasFeature(PREMIUM_FEATURES.habitDetailStats);

  return (
    <BottomSheet open={open} onClose={onClose} title={`${habit.emoji ?? "•"} ${habit.label}`}>
      {/* Schedule days section — always visible */}
      <ScheduleDays habitId={habit.id} open={open} />

      {!isPremium ? (
        <div className="py-4">
          <PremiumGate feature="Per-Habit Analytics" />
        </div>
      ) : loading || !stats ? (
        <div className="py-8 text-center">
          <div className="animate-spin w-6 h-6 border-2 rounded-full mx-auto"
            style={{ borderColor: "var(--text-faint)", borderTopColor: "var(--accent-green)" }} />
        </div>
      ) : (
        <div className="space-y-5 py-2">
          {/* Main stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Completion rate" value={`${stats.completionRate}%`}
              color={stats.completionRate >= 80 ? "var(--accent-green-text)" : stats.completionRate >= 50 ? "var(--accent-yellow-text)" : "var(--accent-red)"} />
            <StatBox label="Current streak" value={`${stats.currentStreak}`} />
            <StatBox label="Best streak" value={`${stats.bestStreak}`} />
            <StatBox label="Times completed" value={`${stats.totalDone}`} />
          </div>

          {/* Best/worst day */}
          <div className="flex gap-3">
            <div className="flex-1 rounded-xl p-3" style={{ background: "var(--accent-green-soft)" }}>
              <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: "var(--accent-green-text)", opacity: 0.7 }}>Best day</p>
              <p className="text-lg font-bold" style={{ color: "var(--accent-green-text)" }}>{stats.bestDay}</p>
            </div>
            <div className="flex-1 rounded-xl p-3" style={{ background: "var(--bg-card-hover)" }}>
              <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>Weakest day</p>
              <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{stats.worstDay}</p>
            </div>
          </div>

          {/* Last 14 days dots */}
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>Last 14 days</p>
            <div className="flex gap-1.5">
              {stats.last14.map((d) => (
                <div key={d.dateKey} className="flex-1 h-6 rounded-sm"
                  style={{ background: d.done ? "var(--accent-green)" : "var(--bg-card-hover)" }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "var(--bg-card-hover)" }}>
      <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>{label}</p>
      <p className="text-xl font-bold mt-0.5" style={{ color: color ?? "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

const SCHED_DAYS = [
  { iso: 1, short: "M" },
  { iso: 2, short: "T" },
  { iso: 3, short: "W" },
  { iso: 4, short: "T" },
  { iso: 5, short: "F" },
  { iso: 6, short: "S" },
  { iso: 7, short: "S" },
] as const;

function ScheduleDays({ habitId, open }: { habitId: string; open: boolean }) {
  const [days, setDays] = useState<number[] | null>(null); // null = every day
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open) { setLoaded(false); return; }
    void (async () => {
      const items = await listRoutineItems();
      const item = items.find(i => i.id === habitId);
      setDays(item?.days_of_week && item.days_of_week.length > 0 ? item.days_of_week : null);
      setLoaded(true);
    })();
  }, [open, habitId]);

  const toggleDay = useCallback(async (iso: number) => {
    hapticLight();
    const current = days ?? [1, 2, 3, 4, 5, 6, 7];
    let next: number[];
    if (current.includes(iso)) {
      next = current.filter(d => d !== iso);
      if (next.length === 0) return; // must have at least 1 day
    } else {
      next = [...current, iso].sort();
    }
    // If all 7 selected, treat as "every day" (null)
    const dbVal = next.length === 7 ? null : next;
    setDays(dbVal);
    await updateRoutineItem(habitId, { days_of_week: dbVal });
  }, [days, habitId]);

  const setEveryDay = useCallback(async () => {
    hapticLight();
    setDays(null);
    await updateRoutineItem(habitId, { days_of_week: null });
  }, [habitId]);

  if (!loaded) return null;

  const isCustom = days !== null;

  return (
    <div className="mb-4 pb-4" style={{ borderBottom: "1px solid var(--border-primary)" }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Calendar size={14} style={{ color: "var(--text-muted)" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
            Show on days
          </span>
        </div>
        {isCustom && (
          <button type="button" onClick={setEveryDay}
            className="text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ background: "var(--bg-card-hover)", color: "var(--text-muted)" }}>
            Every day
          </button>
        )}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {SCHED_DAYS.map(({ iso, short }) => {
          const active = days === null || days.includes(iso);
          return (
            <button key={iso} type="button" onClick={() => toggleDay(iso)}
              className="flex items-center justify-center rounded-xl py-2 text-xs font-bold transition-all"
              style={{
                background: active ? "var(--accent-green)" : "var(--bg-primary)",
                color: active ? "var(--text-inverse)" : "var(--text-muted)",
                border: `1px solid ${active ? "var(--accent-green)" : "var(--border-primary)"}`,
              }}>
              {short}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] mt-2" style={{ color: "var(--text-faint)" }}>
        {isCustom
          ? "This habit will only appear on selected days — not as a bonus on other days."
          : "Showing every day. Tap days to limit when this habit appears."}
      </p>
    </div>
  );
}
