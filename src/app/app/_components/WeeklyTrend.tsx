"use client";

import { useEffect, useMemo, useState } from "react";
import { subDays } from "date-fns";
import { loadRangeStates, listRoutineItems, toDateKey } from "@/lib/supabaseData";
import { SkeletonLine } from "@/app/app/_components/ui";

type WeekStat = {
  label: string;
  greenPct: number;
  greenDays: number;
  totalDays: number;
};

export function WeeklyTrend() {
  const [weeks, setWeeks] = useState<WeekStat[]>([]);
  const [loading, setLoading] = useState(true);

  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const today = toDateKey(now);
        const from = toDateKey(subDays(now, 55)); // ~8 weeks

        const [items, range] = await Promise.all([
          listRoutineItems(),
          loadRangeStates({ from, to: today }),
        ]);

        const coreItems = items.filter(i => i.is_non_negotiable && i.is_active);
        if (coreItems.length === 0) { setLoading(false); return; }

        const coreIds = new Set(coreItems.map(i => i.id));

        // Gather active dates
        const activeDates = new Set<string>();
        for (const c of range.checks) activeDates.add(c.date);

        // Per-day green/not
        const dayColors = new Map<string, boolean>();
        for (const dk of activeDates) {
          if (dk > today) continue;
          const dayChecks = range.checks.filter(c => c.date === dk);
          const coreDone = dayChecks.filter(c => coreIds.has(c.routine_item_id) && c.done).length;
          dayColors.set(dk, coreDone === coreItems.length);
        }

        // Group into weeks (Mon-Sun)
        const weekStats: WeekStat[] = [];
        for (let w = 7; w >= 0; w--) {
          const weekEnd = subDays(now, w * 7);
          const weekStart = subDays(weekEnd, 6);
          const startKey = toDateKey(weekStart);
          const endKey = toDateKey(weekEnd);

          let green = 0, total = 0;
          for (const [dk, isGreen] of dayColors) {
            if (dk >= startKey && dk <= endKey) {
              total++;
              if (isGreen) green++;
            }
          }

          if (total > 0) {
            const label = w === 0 ? "This wk" : w === 1 ? "Last wk" : `${w}w ago`;
            weekStats.push({
              label,
              greenPct: Math.round((green / total) * 100),
              greenDays: green,
              totalDays: total,
            });
          }
        }

        if (!cancelled) setWeeks(weekStats);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [now]);

  if (loading) return <SkeletonLine width="100%" height="120px" />;
  if (weeks.length < 2) return null;

  const maxPct = 100;
  const barHeight = 96;

  return (
    <section className="card p-5 pb-4">
      <h3 className="text-xs font-bold tracking-wider uppercase mb-5" style={{ color: "var(--text-faint)" }}>
        Weekly Trend
      </h3>

      <div className="flex items-end gap-1" style={{ height: barHeight }}>
        {weeks.map((w, i) => {
          const h = Math.max(6, (w.greenPct / maxPct) * barHeight);
          const isLast = i === weeks.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center" style={{ minWidth: 0 }}>
              {/* Percentage label */}
              <span className="font-bold tabular-nums mb-1"
                style={{
                  fontSize: 10,
                  lineHeight: 1,
                  color: isLast ? "var(--accent-green-text)" : "var(--text-faint)",
                }}>
                {w.greenPct}%
              </span>
              {/* Bar */}
              <div className="rounded-t-md animate-progress-fill"
                style={{
                  width: "70%",
                  height: h,
                  background: w.greenPct >= 80 ? "var(--accent-green)" :
                    w.greenPct >= 50 ? "var(--accent-yellow)" : "var(--accent-red)",
                  opacity: isLast ? 1 : 0.6,
                  animationDelay: `${i * 80}ms`,
                }} />
            </div>
          );
        })}
      </div>

      {/* Week labels — separate row for alignment */}
      <div className="flex gap-1 mt-1.5">
        {weeks.map((w, i) => {
          const isLast = i === weeks.length - 1;
          return (
            <div key={i} className="flex-1 text-center" style={{ minWidth: 0 }}>
              <span className="font-medium"
                style={{
                  fontSize: 9,
                  lineHeight: 1,
                  color: isLast ? "var(--text-primary)" : "var(--text-faint)",
                }}>
                {w.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Trend summary */}
      {weeks.length >= 2 && (() => {
        const recent = weeks[weeks.length - 1].greenPct;
        const prior = weeks[weeks.length - 2].greenPct;
        const diff = recent - prior;
        if (Math.abs(diff) < 5) return null;
        return (
          <p className="text-[11px] mt-3 text-center" style={{ color: diff > 0 ? "var(--accent-green-text)" : "var(--text-muted)" }}>
            {diff > 0 ? `↑ ${diff} points from last week` : `↓ ${Math.abs(diff)} points from last week`}
          </p>
        );
      })()}
    </section>
  );
}
