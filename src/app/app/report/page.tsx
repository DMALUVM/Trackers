"use client";

import { useEffect, useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { Download, Share2 } from "lucide-react";
import { SubPageHeader, SkeletonCard } from "@/app/app/_components/ui";
import { listRoutineItems, loadRangeStates, toDateKey } from "@/lib/supabaseData";
import { useStreaks } from "@/lib/hooks";
import { useInsights } from "@/lib/hooks/useInsights";
import type { RoutineItemRow, DailyLogRow } from "@/lib/types";
import { hapticMedium } from "@/lib/haptics";

type DayData = {
  dateKey: string;
  dow: string;
  isGreen: boolean;
  isYellow: boolean;
  coreDone: number;
  coreTotal: number;
};

export default function ReportPage() {
  const now = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(now), [now]);
  const fromKey = useMemo(() => toDateKey(subDays(now, 29)), [now]);

  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<DayData[]>([]);
  const [habitRates, setHabitRates] = useState<Array<{ label: string; emoji: string; rate: number; isCore: boolean }>>([]);
  const streaks = useStreaks(todayKey);
  const { insights } = useInsights();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [items, range] = await Promise.all([
          listRoutineItems(),
          loadRangeStates({ from: fromKey, to: todayKey }),
        ]);

        const active = items.filter(i => i.is_active);
        const coreIds = new Set(active.filter(i => i.is_non_negotiable).map(i => i.id));
        const coreItems = active.filter(i => i.is_non_negotiable);

        // Per-day data
        const activeDates = new Set<string>();
        for (const c of range.checks) activeDates.add(c.date);

        const dayList: DayData[] = [];
        for (const dateKey of [...activeDates].sort()) {
          if (dateKey > todayKey) continue;
          const dayChecks = range.checks.filter(c => c.date === dateKey);
          const checkedIds = new Set(dayChecks.filter(c => c.done).map(c => c.routine_item_id));
          const coreDone = coreItems.filter(i => checkedIds.has(i.id)).length;
          const coreMissed = coreItems.length - coreDone;

          dayList.push({
            dateKey,
            dow: format(new Date(dateKey + "T12:00:00"), "EEE"),
            isGreen: coreMissed === 0,
            isYellow: coreMissed === 1,
            coreDone,
            coreTotal: coreItems.length,
          });
        }

        // Habit completion rates
        const habitDone = new Map<string, number>();
        const habitTotal = new Map<string, number>();
        for (const dateKey of activeDates) {
          const dayChecks = range.checks.filter(c => c.date === dateKey);
          for (const item of active) {
            habitTotal.set(item.id, (habitTotal.get(item.id) ?? 0) + 1);
            if (dayChecks.find(c => c.routine_item_id === item.id && c.done)) {
              habitDone.set(item.id, (habitDone.get(item.id) ?? 0) + 1);
            }
          }
        }

        const rates = active
          .map(item => ({
            label: item.label,
            emoji: item.emoji ?? "•",
            rate: Math.round(((habitDone.get(item.id) ?? 0) / Math.max(habitTotal.get(item.id) ?? 1, 1)) * 100),
            isCore: item.is_non_negotiable,
          }))
          .sort((a, b) => b.rate - a.rate);

        if (!cancelled) {
          setDays(dayList);
          setHabitRates(rates);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fromKey, todayKey]);

  const greenDays = days.filter(d => d.isGreen).length;
  const yellowDays = days.filter(d => d.isYellow).length;
  const trackedDays = days.length;
  const greenPct = trackedDays > 0 ? Math.round((greenDays / trackedDays) * 100) : 0;

  const handleSave = () => {
    hapticMedium();
    window.print();
  };

  const handleShare = async () => {
    hapticMedium();
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Routines365 Progress Report",
          text: `${greenDays}/${trackedDays} green days (${greenPct}%) · ${streaks.currentStreak} day streak`,
          url: window.location.href,
        });
      } catch {}
    }
  };

  if (loading || streaks.loading) {
    return (
      <div className="space-y-6">
        <SubPageHeader title="Progress Report" backHref="/app/routines/progress" />
        <SkeletonCard lines={5} />
        <SkeletonCard lines={3} />
      </div>
    );
  }

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          nav, .nav-bar, .no-print, header button { display: none !important; }
          main { padding: 0 !important; }
          .card { break-inside: avoid; box-shadow: none !important; border: 1px solid #e5e7eb !important; }
          body { background: white !important; color: black !important; }
          * { color: black !important; }
          .print-title { display: block !important; }
        }
      `}</style>

      <div className="space-y-6 stagger-sections">
        {/* Header */}
        <div className="no-print">
          <SubPageHeader
            title="Progress Report"
            subtitle={`${format(new Date(fromKey + "T12:00:00"), "MMM d")} – ${format(now, "MMM d, yyyy")}`}
            backHref="/app/routines/progress"
            rightAction={
              <div className="flex gap-2">
                {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                  <button type="button" onClick={handleShare}
                    className="tap-btn flex items-center justify-center rounded-full"
                    style={{ width: 36, height: 36, background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
                    <Share2 size={16} style={{ color: "var(--text-muted)" }} />
                  </button>
                )}
                <button type="button" onClick={handleSave}
                  className="tap-btn flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold"
                  style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>
                  <Download size={14} />
                  Save PDF
                </button>
              </div>
            }
          />
        </div>

        {/* Print-only title */}
        <div className="print-title hidden text-center mb-4">
          <h1 className="text-2xl font-bold">Routines365 Progress Report</h1>
          <p className="text-sm text-gray-500">
            {format(new Date(fromKey + "T12:00:00"), "MMM d")} – {format(now, "MMM d, yyyy")}
          </p>
        </div>

        {/* Overview card */}
        <section className="card p-5">
          <h3 className="text-xs font-bold tracking-wider uppercase mb-4" style={{ color: "var(--text-faint)" }}>Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--accent-green-text)" }}>{greenPct}%</p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>Green day rate</p>
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{streaks.currentStreak}</p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>Current streak</p>
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{streaks.bestStreak}</p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>Best streak</p>
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{trackedDays}</p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>Days tracked</p>
            </div>
          </div>
        </section>

        {/* 30-day heatmap */}
        <section className="card p-5">
          <h3 className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: "var(--text-faint)" }}>Last 30 Days</h3>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 30 }).map((_, i) => {
              const dk = toDateKey(subDays(now, 29 - i));
              const day = days.find(d => d.dateKey === dk);
              const bg = day?.isGreen ? "var(--accent-green)" : day?.isYellow ? "var(--accent-yellow)" : day ? "var(--accent-red)" : "var(--bg-card-hover)";
              return (
                <div key={dk} title={`${dk}: ${day ? `${day.coreDone}/${day.coreTotal}` : "no data"}`}
                  style={{ width: 18, height: 18, borderRadius: 4, background: bg, opacity: day ? 1 : 0.3 }} />
              );
            })}
          </div>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--accent-green)" }} />
              <span className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>{greenDays} green</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--accent-yellow)" }} />
              <span className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>{yellowDays} yellow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--accent-red)" }} />
              <span className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>{trackedDays - greenDays - yellowDays} red</span>
            </div>
          </div>
        </section>

        {/* Habit breakdown */}
        <section className="card p-5">
          <h3 className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: "var(--text-faint)" }}>Habit Breakdown</h3>
          <div className="space-y-3">
            {habitRates.map((h) => (
              <div key={h.label} className="flex items-center gap-3">
                <span className="text-base shrink-0">{h.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {h.label}
                      {h.isCore && (
                        <span className="ml-1.5 text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded-full"
                          style={{ background: "var(--bg-card-hover)", color: "var(--text-faint)" }}>CORE</span>
                      )}
                    </span>
                    <span className="text-sm font-bold tabular-nums shrink-0 ml-2" style={{ color: "var(--text-primary)" }}>
                      {h.rate}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-card-hover)" }}>
                    <div className="h-full rounded-full animate-progress-fill"
                      style={{
                        width: `${h.rate}%`,
                        background: h.rate >= 80 ? "var(--accent-green)" : h.rate >= 50 ? "var(--accent-yellow)" : "var(--accent-red)",
                      }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Insights */}
        {insights.length > 0 && (
          <section className="card p-5">
            <h3 className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: "var(--text-faint)" }}>Insights</h3>
            <div className="space-y-3">
              {insights.slice(0, 4).map((insight) => (
                <div key={insight.id} className="flex gap-3">
                  <span className="text-lg shrink-0">{insight.emoji}</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{insight.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{insight.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center py-4 no-print">
          <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>
            Tap "Save PDF" to download or share this report
          </p>
        </footer>
      </div>
    </>
  );
}
