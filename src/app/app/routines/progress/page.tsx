"use client";

import { format, isSameMonth } from "date-fns";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { computeDayColor, type DayColor } from "@/lib/progress";
import { monthGridDates, monthLabel, nextMonth, prevMonth } from "@/lib/calendar";
import { listRoutineItems, loadRangeStates } from "@/lib/supabaseData";
import type { DailyLogRow, RoutineItemRow } from "@/lib/types";
import { useStreaks } from "@/lib/hooks";
import { useMultiActivityTotals, type MultiTotalsEntry } from "@/lib/hooks/useActivityTotals";
import { SkeletonCard } from "@/app/app/_components/ui";
import { toDateKey } from "@/lib/supabaseData";

// ---------------------------------------------------------------------------
// Calendar color dot
// ---------------------------------------------------------------------------
function dotColor(c: DayColor): string {
  if (c === "green") return "var(--accent-green)";
  if (c === "yellow") return "var(--accent-yellow)";
  if (c === "red") return "var(--accent-red)";
  return "var(--bg-card-hover)";
}

// ---------------------------------------------------------------------------
// Activity totals config
// ---------------------------------------------------------------------------
const ACTIVITY_ENTRIES: MultiTotalsEntry[] = [
  { activityKey: "rowing", unit: "meters", label: "Rowing (m)" },
  { activityKey: "walking", unit: "steps", label: "Walking (steps)" },
  { activityKey: "running", unit: "miles", label: "Running (mi)" },
];

// ---------------------------------------------------------------------------
// Stat pill
// ---------------------------------------------------------------------------
function StatPill({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card-interactive px-3 py-2.5">
      <p className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{value}</p>
      {sub && <p className="mt-0.5 text-[10px]" style={{ color: "var(--text-faint)" }}>{sub}</p>}
    </div>
  );
}

// ===========================================================================
// PROGRESS PAGE
// ===========================================================================
export default function RoutinesProgressPage() {
  const now = useMemo(() => new Date(), []);
  const dateKey = useMemo(() => toDateKey(now), [now]);

  // Calendar state
  const [month, setMonth] = useState<Date>(now);
  const [routineItems, setRoutineItems] = useState<RoutineItemRow[]>([]);
  const [logs, setLogs] = useState<DailyLogRow[]>([]);
  const [checks, setChecks] = useState<Array<{ date: string; routine_item_id: string; done: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Shared hooks
  const streaks = useStreaks(dateKey);
  const { data: actTotals, loading: actLoading } = useMultiActivityTotals(ACTIVITY_ENTRIES);

  // Calendar grid
  const days = useMemo(() => monthGridDates(month), [month]);
  const fromKey = useMemo(() => format(days[0], "yyyy-MM-dd"), [days]);
  const toKey = useMemo(() => format(days[days.length - 1], "yyyy-MM-dd"), [days]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true); setError("");
      try {
        const [items, dataRange] = await Promise.all([
          listRoutineItems(),
          loadRangeStates({ from: fromKey, to: toKey }),
        ]);
        if (cancelled) return;
        setRoutineItems(items);
        setLogs(dataRange.logs);
        setChecks(dataRange.checks);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fromKey, toKey]);

  const logMap = useMemo(() => {
    const m = new Map<string, DailyLogRow>();
    for (const l of logs) m.set(l.date, l);
    return m;
  }, [logs]);

  const checksByDate = useMemo(() => {
    const m = new Map<string, Array<{ routine_item_id: string; done: boolean }>>();
    for (const c of checks) {
      const arr = m.get(c.date) ?? [];
      arr.push({ routine_item_id: c.routine_item_id, done: c.done });
      m.set(c.date, arr);
    }
    return m;
  }, [checks]);

  // Helpers for activity totals display
  const fmt = (n: number) => n >= 10000 ? `${(n / 1000).toFixed(1)}k` : Math.round(n).toLocaleString();
  const rowing = actTotals["rowing:meters"] ?? { wtd: 0, mtd: 0, ytd: 0, all: 0 };
  const walking = actTotals["walking:steps"] ?? { wtd: 0, mtd: 0, ytd: 0, all: 0 };
  const running = actTotals["running:miles"] ?? { wtd: 0, mtd: 0, ytd: 0, all: 0 };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Progress</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          Tap a day to edit it. Green/yellow/red is based on your core habits.
        </p>
        {error && (
          <div className="mt-2 card p-3" style={{ borderColor: "var(--accent-red)" }}>
            <p className="text-xs" style={{ color: "var(--accent-red)" }}>{error}</p>
          </div>
        )}
      </header>

      {/* Calendar */}
      <section className="card p-4">
        <div className="flex items-center justify-between">
          <button type="button" className="btn-secondary p-2" onClick={() => setMonth((m) => prevMonth(m))}>
            <ChevronLeft size={18} />
          </button>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{monthLabel(month)}</div>
          <button type="button" className="btn-secondary p-2" onClick={() => setMonth((m) => nextMonth(m))}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[11px]" style={{ color: "var(--text-faint)" }}>
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <div key={i}>{d}</div>)}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {days.map((d) => {
            const dk = format(d, "yyyy-MM-dd");
            const inMonth = isSameMonth(d, month);
            const color: DayColor = loading ? "empty" : computeDayColor({
              dateKey: dk, routineItems,
              checks: checksByDate.get(dk) ?? [],
              log: logMap.get(dk) ?? null,
            });
            return (
              <Link key={dk} href={`/app/routines/edit/${dk}`}
                className="flex flex-col items-center gap-1"
                style={{ opacity: inMonth ? 1 : 0.35 }}>
                <div className="h-9 w-9 rounded-xl" style={{
                  background: dotColor(color),
                  border: "1px solid var(--border-primary)",
                }} />
                <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>{format(d, "d")}</div>
              </Link>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded" style={{ background: "var(--accent-green)" }} /> Green: all core done
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded" style={{ background: "var(--accent-yellow)" }} /> Yellow: missed 1
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded" style={{ background: "var(--accent-red)" }} /> Red: missed 2+
          </span>
        </div>
      </section>

      {/* Streaks + hit rate (from shared hook) */}
      {!streaks.loading && (
        <section className="card p-4 space-y-3">
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Streaks & consistency</p>
          <div className="grid grid-cols-2 gap-2">
            <StatPill label="Current streak" value={`${streaks.currentStreak}d`} sub="Consecutive green days" />
            <StatPill label="Best streak" value={`${streaks.bestStreak}d`} />
            <StatPill label="Core hit-rate (week)" value={streaks.coreHitRateThisWeek === null ? "—" : `${streaks.coreHitRateThisWeek}%`} />
            <StatPill label="Green days (month)" value={String(streaks.greenDaysThisMonth)} />
          </div>
        </section>
      )}

      {/* Activity totals (from shared hook) */}
      {actLoading ? <SkeletonCard lines={3} /> : (
        <section className="card p-4 space-y-3">
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Activity totals</p>

          {/* Rowing */}
          <div className="card-interactive px-3 py-3">
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>🚣 Rowing (meters)</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              <StatPill label="WTD" value={fmt(rowing.wtd)} />
              <StatPill label="MTD" value={fmt(rowing.mtd)} />
              <StatPill label="YTD" value={fmt(rowing.ytd)} />
              <StatPill label="All" value={fmt(rowing.all)} />
            </div>
          </div>

          {/* Walking */}
          <div className="card-interactive px-3 py-3">
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>🚶 Walking (steps)</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              <StatPill label="WTD" value={fmt(walking.wtd)} />
              <StatPill label="MTD" value={fmt(walking.mtd)} />
              <StatPill label="YTD" value={fmt(walking.ytd)} />
              <StatPill label="All" value={fmt(walking.all)} />
            </div>
          </div>

          {/* Running */}
          <div className="card-interactive px-3 py-3">
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>🏃 Running (miles)</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              <StatPill label="WTD" value={running.wtd.toFixed(1)} />
              <StatPill label="MTD" value={running.mtd.toFixed(1)} />
              <StatPill label="YTD" value={running.ytd.toFixed(1)} />
              <StatPill label="All" value={running.all.toFixed(1)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link href="/app/rowing" className="btn-secondary text-center text-xs">Log rowing</Link>
            <Link href="/app/cardio" className="btn-secondary text-center text-xs">Log cardio</Link>
          </div>
        </section>
      )}
    </div>
  );
}
