"use client";

import { format, isSameMonth, isToday as isTodayFn } from "date-fns";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Award } from "lucide-react";
import { computeDayColor, type DayColor } from "@/lib/progress";
import { monthGridDates, monthLabel, nextMonth, prevMonth } from "@/lib/calendar";
import { listRoutineItems, loadRangeStates } from "@/lib/supabaseData";
import type { DailyLogRow, RoutineItemRow } from "@/lib/types";
import { useStreaks } from "@/lib/hooks";
import { useMultiActivityTotals, type MultiTotalsEntry } from "@/lib/hooks/useActivityTotals";
import { SkeletonCard } from "@/app/app/_components/ui";
import { toDateKey } from "@/lib/supabaseData";
import { hapticLight } from "@/lib/haptics";

// Calendar cell color
function cellStyle(color: DayColor, inMonth: boolean, today: boolean): React.CSSProperties {
  const opacity = inMonth ? 1 : 0.25;
  const base: React.CSSProperties = { opacity, borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, transition: "background 0.2s, transform 0.15s" };
  if (today) base.boxShadow = "0 0 0 2px var(--accent-green)";
  switch (color) {
    case "green": return { ...base, background: "var(--accent-green)", color: "var(--text-inverse)" };
    case "yellow": return { ...base, background: "var(--accent-yellow)", color: "var(--text-inverse)" };
    case "red": return { ...base, background: "var(--accent-red)", color: "var(--text-inverse)" };
    default: return { ...base, background: "var(--bg-card-hover)", color: "var(--text-faint)" };
  }
}

// Stat card
function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
      <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{value}</p>
      {sub && <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>{sub}</p>}
    </div>
  );
}

// Activity totals config
const ACTIVITY_ENTRIES: MultiTotalsEntry[] = [
  { activityKey: "rowing", unit: "meters", label: "Rowing" },
  { activityKey: "walking", unit: "steps", label: "Walking" },
  { activityKey: "running", unit: "miles", label: "Running" },
];

export default function RoutinesProgressPage() {
  const now = useMemo(() => new Date(), []);
  const dateKey = useMemo(() => toDateKey(now), [now]);

  const [month, setMonth] = useState<Date>(now);
  const [routineItems, setRoutineItems] = useState<RoutineItemRow[]>([]);
  const [logs, setLogs] = useState<DailyLogRow[]>([]);
  const [checks, setChecks] = useState<Array<{ date: string; routine_item_id: string; done: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accountStartKey, setAccountStartKey] = useState<string | null>(null);

  const streaks = useStreaks(dateKey);
  const { data: actTotals, loading: actLoading } = useMultiActivityTotals(ACTIVITY_ENTRIES);

  const days = useMemo(() => monthGridDates(month), [month]);
  const fromKey = useMemo(() => format(days[0], "yyyy-MM-dd"), [days]);
  const toKey = useMemo(() => format(days[days.length - 1], "yyyy-MM-dd"), [days]);

  // Load everything together so calendar never renders without accountStartKey
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true); setError("");
      try {
        const { supabase } = await import("@/lib/supabaseClient");

        // Get account start date (instant — from in-memory session)
        const { data: { session } } = await supabase.auth.getSession();
        if (!cancelled && session?.user?.created_at) {
          setAccountStartKey(session.user.created_at.slice(0, 10));
        }

        const [items, dataRange] = await Promise.all([listRoutineItems(), loadRangeStates({ from: fromKey, to: toKey })]);
        if (cancelled) return;
        setRoutineItems(items); setLogs(dataRange.logs); setChecks(dataRange.checks);
      } catch (e: unknown) { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [fromKey, toKey]);

  const logMap = useMemo(() => { const m = new Map<string, DailyLogRow>(); for (const l of logs) m.set(l.date, l); return m; }, [logs]);
  const checksByDate = useMemo(() => {
    const m = new Map<string, Array<{ routine_item_id: string; done: boolean }>>();
    for (const c of checks) { const arr = m.get(c.date) ?? []; arr.push({ routine_item_id: c.routine_item_id, done: c.done }); m.set(c.date, arr); }
    return m;
  }, [checks]);

  const fmt = (n: number) => n >= 10000 ? `${(n / 1000).toFixed(1)}k` : Math.round(n).toLocaleString();
  const rowing = actTotals["rowing:meters"] ?? { wtd: 0, mtd: 0, ytd: 0, all: 0 };
  const walking = actTotals["walking:steps"] ?? { wtd: 0, mtd: 0, ytd: 0, all: 0 };
  const running = actTotals["running:miles"] ?? { wtd: 0, mtd: 0, ytd: 0, all: 0 };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Progress</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Tap any day to edit.</p>
        {error && <p className="text-xs mt-2" style={{ color: "var(--accent-red-text)" }}>{error}</p>}
      </header>

      {/* ── CALENDAR ── */}
      <section className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <button type="button" className="flex items-center justify-center rounded-full" style={{ width: 36, height: 36, background: "var(--bg-card-hover)" }}
            onClick={() => { hapticLight(); setMonth((m) => prevMonth(m)); }}>
            <ChevronLeft size={18} style={{ color: "var(--text-muted)" }} />
          </button>
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{monthLabel(month)}</h2>
          <button type="button" className="flex items-center justify-center rounded-full" style={{ width: 36, height: 36, background: "var(--bg-card-hover)" }}
            onClick={() => { hapticLight(); setMonth((m) => nextMonth(m)); }}>
            <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-2">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold tracking-wider" style={{ color: "var(--text-faint)" }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-y-1.5">
          {days.map((d) => {
            const dk = format(d, "yyyy-MM-dd");
            const inMonth = isSameMonth(d, month);
            const today = isTodayFn(d);
            const color: DayColor = loading ? "empty" : computeDayColor({
              dateKey: dk, routineItems,
              checks: checksByDate.get(dk) ?? [],
              log: logMap.get(dk) ?? null,
              todayKey: dateKey,
              accountStartKey,
            });
            return (
              <Link key={dk} href={`/app/routines/edit/${dk}`} className="flex justify-center"
                onClick={() => hapticLight()}>
                <div style={cellStyle(color, inMonth, today)}>
                  {format(d, "d")}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] justify-center" style={{ color: "var(--text-muted)" }}>
          {([
            { c: "var(--accent-green)", l: "All core" },
            { c: "var(--accent-yellow)", l: "Missed 1" },
            { c: "var(--accent-red)", l: "Missed 2+" },
          ]).map(({ c, l }) => (
            <span key={l} className="inline-flex items-center gap-1.5">
              <span className="rounded-full" style={{ width: 8, height: 8, background: c }} /> {l}
            </span>
          ))}
        </div>
      </section>

      {/* ── STREAKS ── */}
      {!streaks.loading && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>Streaks</p>
            <Link href="/app/trophies" className="flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: "var(--accent-green)" }} onClick={() => hapticLight()}>
              <Award size={14} /> Trophies
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Current" value={`${streaks.currentStreak}`} sub="consecutive green days" />
            <Stat label="Best" value={`${streaks.bestStreak}`} sub="all-time record" />
            <Stat label="Core hit-rate" value={streaks.coreHitRateThisWeek === null ? "—" : `${streaks.coreHitRateThisWeek}%`} sub="this week" />
            <Stat label="Green days" value={String(streaks.greenDaysThisMonth)} sub="this month" />
            <Stat label="Total green" value={String(streaks.totalGreenDays)} sub="all-time" />
          </div>
        </section>
      )}

      {/* ── ACTIVITY TOTALS ── */}
      {actLoading ? <SkeletonCard lines={3} /> : (
        <section>
          <p className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: "var(--text-muted)" }}>Activity</p>
          <div className="space-y-3">
            {([
              { emoji: "🚣", name: "Rowing", unit: "meters", data: rowing, fmtFn: fmt },
              { emoji: "🚶", name: "Walking", unit: "steps", data: walking, fmtFn: fmt },
              { emoji: "🏃", name: "Running", unit: "miles", data: running, fmtFn: (n: number) => n.toFixed(1) },
            ] as const).map(({ emoji, name, unit, data: d, fmtFn }) => (
              <div key={name} className="card p-4">
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>{emoji} {name} <span style={{ color: "var(--text-faint)" }}>({unit})</span></p>
                <div className="grid grid-cols-4 gap-2">
                  {(["WTD", "MTD", "YTD", "All"] as const).map((period, i) => (
                    <div key={period} className="text-center">
                      <p className="text-[10px] font-bold tracking-wider" style={{ color: "var(--text-faint)" }}>{period}</p>
                      <p className="mt-0.5 text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                        {fmtFn([d.wtd, d.mtd, d.ytd, d.all][i])}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
