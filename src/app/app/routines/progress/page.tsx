"use client";

import { format, isSameMonth, isToday as isTodayFn } from "date-fns";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Award, FileText, Activity } from "lucide-react";
import { computeDayColor, type DayColor } from "@/lib/progress";
import { monthGridDates, monthLabel, nextMonth, prevMonth } from "@/lib/calendar";
import { listRoutineItems, loadRangeStates } from "@/lib/supabaseData";
import type { DailyLogRow, RoutineItemRow } from "@/lib/types";
import { useStreaks } from "@/lib/hooks";
import { labelToMetricKey, METRIC_ACTIVITIES } from "@/lib/constants";
import type { ActivityKey, ActivityUnit } from "@/lib/activity";
import { useMultiActivityTotals, type MultiTotalsEntry } from "@/lib/hooks/useActivityTotals";
import { SkeletonCard } from "@/app/app/_components/ui";
import { toDateKey } from "@/lib/supabaseData";
import { hapticLight } from "@/lib/haptics";
import { SleepStageBreakdown } from "@/app/app/_components/SleepStageBreakdown";
import { BiometricCorrelations } from "@/app/app/_components/BiometricCorrelations";
import { InsightsCard } from "@/app/app/_components/InsightsCard";
import { WeeklyTrend } from "@/app/app/_components/WeeklyTrend";
import { ShareCard } from "@/app/app/_components/ShareCard";
import { usePremium, PREMIUM_FEATURES } from "@/lib/premium";
import { PremiumGate } from "@/app/app/_components/PremiumGate";

// Calendar cell color
function cellStyle(color: DayColor, inMonth: boolean, today: boolean): React.CSSProperties {
  const opacity = inMonth ? 1 : 0.25;
  const base: React.CSSProperties = { opacity, borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 600, transition: "background 0.2s, transform 0.15s" };
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

export default function RoutinesProgressPage() {
  const now = useMemo(() => new Date(), []);
  const dateKey = useMemo(() => toDateKey(now), [now]);

  const [month, setMonth] = useState<Date>(now);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const [slideKey, setSlideKey] = useState(0);
  const [routineItems, setRoutineItems] = useState<RoutineItemRow[]>([]);
  const [logs, setLogs] = useState<DailyLogRow[]>([]);
  const [checks, setChecks] = useState<Array<{ date: string; routine_item_id: string; done: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accountStartKey, setAccountStartKey] = useState<string | null>(null);

  const streaks = useStreaks(dateKey);
  const { hasFeature, isPremium } = usePremium();

  // Dynamically detect which activities to show totals for based on user's routine items
  // Always include hydration since the WaterTracker is on the Today page
  const activityEntries: MultiTotalsEntry[] = useMemo(() => {
    const seen = new Set<string>();
    const entries: MultiTotalsEntry[] = [];

    // Always add hydration (WaterTracker is built-in)
    entries.push({ activityKey: "hydration" as ActivityKey, unit: "glasses" as ActivityUnit, label: "Hydration" });
    seen.add("hydration");

    for (const ri of routineItems) {
      const metricKey = labelToMetricKey(ri.label);
      if (!metricKey || seen.has(metricKey)) continue;
      seen.add(metricKey);
      const act = METRIC_ACTIVITIES[metricKey];
      if (!act) continue;
      const primaryField = act.fields[0];
      entries.push({
        activityKey: act.key as ActivityKey,
        unit: primaryField.unit as ActivityUnit,
        label: act.title,
      });
    }
    return entries;
  }, [routineItems]);

  const { data: actTotals, loading: actLoading } = useMultiActivityTotals(activityEntries);

  const days = useMemo(() => monthGridDates(month), [month]);
  const fromKey = useMemo(() => format(days[0], "yyyy-MM-dd"), [days]);
  const toKey = useMemo(() => format(days[days.length - 1], "yyyy-MM-dd"), [days]);

  // Load everything together so calendar never renders without accountStartKey
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen for pull-to-refresh events
  useEffect(() => {
    const onPull = () => setRefreshKey((k) => k + 1);
    window.addEventListener("routines365:pullRefresh", onPull);
    window.addEventListener("routines365:routinesChanged", onPull);
    return () => {
      window.removeEventListener("routines365:pullRefresh", onPull);
      window.removeEventListener("routines365:routinesChanged", onPull);
    };
  }, []);

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
  }, [fromKey, toKey, refreshKey]);

  const logMap = useMemo(() => { const m = new Map<string, DailyLogRow>(); for (const l of logs) m.set(l.date, l); return m; }, [logs]);
  const checksByDate = useMemo(() => {
    const m = new Map<string, Array<{ routine_item_id: string; done: boolean }>>();
    for (const c of checks) { const arr = m.get(c.date) ?? []; arr.push({ routine_item_id: c.routine_item_id, done: c.done }); m.set(c.date, arr); }
    return m;
  }, [checks]);

  const fmt = (n: number) => n >= 10000 ? `${(n / 1000).toFixed(1)}k` : Math.round(n).toLocaleString();
  const fmtDec = (n: number) => n.toFixed(1);

  return (
    <div className="space-y-6 stagger-sections">
      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Progress</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Tap any day to edit.</p>
        {error && <p className="text-xs mt-2" style={{ color: "var(--accent-red-text)" }}>{error}</p>}
      </header>

      {/* ── CALENDAR ── */}
      <section className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <button type="button" className="flex items-center justify-center rounded-full active:scale-90 transition-transform" style={{ width: 36, height: 36, background: "var(--bg-card-hover)" }}
            onClick={() => { hapticLight(); setSlideDir("left"); setSlideKey(k => k + 1); setMonth((m) => prevMonth(m)); }}>
            <ChevronLeft size={18} style={{ color: "var(--text-muted)" }} />
          </button>
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{monthLabel(month)}</h2>
          <button type="button" className="flex items-center justify-center rounded-full active:scale-90 transition-transform" style={{ width: 36, height: 36, background: "var(--bg-card-hover)" }}
            onClick={() => { hapticLight(); setSlideDir("right"); setSlideKey(k => k + 1); setMonth((m) => nextMonth(m)); }}>
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
        <div key={slideKey} className={`grid grid-cols-7 gap-y-1.5 ${slideDir === "left" ? "animate-slide-in-left" : slideDir === "right" ? "animate-slide-in-right" : ""}`}>
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
            <div className="flex items-center gap-3">
              <Link href="/app/streaks" className="flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: "var(--accent-green)" }} onClick={() => hapticLight()}>
                <Activity size={14} /> My Streaks
              </Link>
              <Link href="/app/trophies" className="flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: "var(--accent-green)" }} onClick={() => hapticLight()}>
                <Award size={14} /> Trophies
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 stagger-children">
            <Stat label="Current" value={`${streaks.activeStreak || streaks.currentStreak}`} sub="consecutive green days" />
            <Stat label="Best" value={`${streaks.bestStreak}`} sub="all-time record" />
            <Stat label="Core hit-rate" value={streaks.coreHitRateThisWeek === null ? "—" : `${streaks.coreHitRateThisWeek}%`} sub="this week" />
            <Stat label="Green days" value={String(streaks.greenDaysThisMonth)} sub="this month" />
            <Stat label="Total green" value={String(streaks.totalGreenDays)} sub="all-time" />
          </div>
        </section>
      )}

      {/* ── INSIGHTS ── */}
      <InsightsCard />

      {/* ── WEEKLY TREND ── */}
      <WeeklyTrend />

      {/* ── SHARE & DOWNLOAD ── */}
      {!streaks.loading && hasFeature(PREMIUM_FEATURES.shareCards) && (
        <ShareCard
          streaks={streaks}
          greenPct={streaks.coreHitRateThisWeek ?? 0}
          greenDays={streaks.totalGreenDays}
          totalDays={streaks.totalGreenDays}
          last7={streaks.last7Days.map(d => ({ color: d.color }))}
        />
      )}
      {hasFeature(PREMIUM_FEATURES.pdfReports) ? (
        <Link href="/app/report" onClick={() => hapticLight()}
          className="card-interactive flex items-center justify-center gap-2 px-4 py-3.5 w-full"
          style={{ textDecoration: "none" }}>
          <FileText size={16} style={{ color: "var(--text-muted)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Download Progress Report</span>
        </Link>
      ) : (
        <PremiumGate feature="Reports & Sharing" compact />
      )}

      {/* Biometric Insights */}
      <Link href="/app/biometrics" onClick={() => hapticLight()}
        className="card-interactive flex items-center justify-center gap-2 px-4 py-3.5 w-full"
        style={{ textDecoration: "none" }}>
        <Activity size={16} style={{ color: "#8b5cf6" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Biometric Insights</span>
        {!isPremium && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1"
            style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>PRO</span>
        )}
      </Link>

      {/* Sleep Stage Breakdown */}
      <SleepStageBreakdown />

      {/* Habit × Body Correlations */}
      <BiometricCorrelations />

      {/* ── ACTIVITY TOTALS ── */}
      {activityEntries.length > 0 && (
        actLoading ? <SkeletonCard lines={3} /> : (
          <section>
            <p className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: "var(--text-muted)" }}>Activity</p>
            <div className="space-y-3">
              {activityEntries.map((entry) => {
                const key = `${entry.activityKey}:${entry.unit}`;
                const d = actTotals[key] ?? { wtd: 0, mtd: 0, ytd: 0, all: 0 };
                const act = METRIC_ACTIVITIES[entry.activityKey];
                const emoji = act?.emoji ?? "📊";
                const useDec = entry.unit === "miles" || entry.unit === "hours";
                const fmtFn = useDec ? fmtDec : fmt;
                return (
                  <div key={key} className="card p-4">
                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                      {emoji} {entry.label} <span style={{ color: "var(--text-faint)" }}>({entry.unit})</span>
                    </p>
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
                );
              })}
            </div>
          </section>
        )
      )}
    </div>
  );
}
