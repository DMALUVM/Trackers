"use client";

import { format, isSameMonth } from "date-fns";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { computeDayColor, weekBounds, type DayColor } from "@/lib/progress";
import { monthGridDates, monthLabel, nextMonth, prevMonth } from "@/lib/calendar";
import { listRoutineItems, loadRangeStates } from "@/lib/supabaseData";
import type { DailyLogRow, RoutineItemRow } from "@/lib/types";
import { sumActivity } from "@/lib/activity";

function dotClasses(color: DayColor) {
  if (color === "green") return "bg-emerald-500/80";
  if (color === "yellow") return "bg-amber-400/80";
  if (color === "red") return "bg-rose-500/80";
  return "bg-white/5";
}

export default function RoutinesProgressPage() {
  const now = useMemo(() => new Date(), []);

  const [month, setMonth] = useState<Date>(now);
  const [routineItems, setRoutineItems] = useState<RoutineItemRow[]>([]);
  const [logs, setLogs] = useState<DailyLogRow[]>([]);
  const [checks, setChecks] = useState<
    Array<{ date: string; routine_item_id: string; done: boolean }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [rowingMetersWeek, setRowingMetersWeek] = useState<number>(0);
  const [rowingMetersMonth, setRowingMetersMonth] = useState<number>(0);
  const [rowingMetersYtd, setRowingMetersYtd] = useState<number>(0);
  const [rowingMetersAll, setRowingMetersAll] = useState<number>(0);

  const [walkingMilesWeek, setWalkingMilesWeek] = useState<number>(0);
  const [walkingMilesMonth, setWalkingMilesMonth] = useState<number>(0);
  const [walkingMilesYtd, setWalkingMilesYtd] = useState<number>(0);
  const [walkingMilesAll, setWalkingMilesAll] = useState<number>(0);

  const [runningMilesWeek, setRunningMilesWeek] = useState<number>(0);
  const [runningMilesMonth, setRunningMilesMonth] = useState<number>(0);
  const [runningMilesYtd, setRunningMilesYtd] = useState<number>(0);
  const [runningMilesAll, setRunningMilesAll] = useState<number>(0);

  const days = useMemo(() => monthGridDates(month), [month]);
  const fromKey = useMemo(() => format(days[0], "yyyy-MM-dd"), [days]);
  const toKey = useMemo(
    () => format(days[days.length - 1], "yyyy-MM-dd"),
    [days]
  );

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const { start, end } = weekBounds(now);
        const weekFrom = format(start, "yyyy-MM-dd");
        const weekTo = format(end, "yyyy-MM-dd");
        // NOTE: Month totals should be based on the calendar month (not the grid spillover).
        const monthFrom = format(month, "yyyy-MM-01");
        const monthTo = format(new Date(month.getFullYear(), month.getMonth() + 1, 0), "yyyy-MM-dd");
        const ytdFrom = `${format(now, "yyyy")}-01-01`;
        const allFrom = "1900-01-01";

        const toToday = format(now, "yyyy-MM-dd");
        const [
          items,
          dataRange,
          mWeek,
          mMonth,
          mYtd,
          mAll,
          wWeek,
          wMonth,
          wYtd,
          wAll,
          rWeek,
          rMonth,
          rYtd,
          rAll,
        ] = await Promise.all([
          listRoutineItems(),
          loadRangeStates({ from: fromKey, to: toKey }),
          sumActivity({ from: weekFrom, to: weekTo, activityKey: "rowing", unit: "meters" }),
          sumActivity({ from: monthFrom, to: monthTo, activityKey: "rowing", unit: "meters" }),
          sumActivity({ from: ytdFrom, to: toToday, activityKey: "rowing", unit: "meters" }),
          sumActivity({ from: allFrom, to: toToday, activityKey: "rowing", unit: "meters" }),

          sumActivity({ from: weekFrom, to: weekTo, activityKey: "walking", unit: "miles" }),
          sumActivity({ from: monthFrom, to: monthTo, activityKey: "walking", unit: "miles" }),
          sumActivity({ from: ytdFrom, to: toToday, activityKey: "walking", unit: "miles" }),
          sumActivity({ from: allFrom, to: toToday, activityKey: "walking", unit: "miles" }),

          sumActivity({ from: weekFrom, to: weekTo, activityKey: "running", unit: "miles" }),
          sumActivity({ from: monthFrom, to: monthTo, activityKey: "running", unit: "miles" }),
          sumActivity({ from: ytdFrom, to: toToday, activityKey: "running", unit: "miles" }),
          sumActivity({ from: allFrom, to: toToday, activityKey: "running", unit: "miles" }),
        ]);

        setRoutineItems(items);
        setLogs(dataRange.logs);
        setChecks(dataRange.checks);

        setRowingMetersWeek(mWeek);
        setRowingMetersMonth(mMonth);
        setRowingMetersYtd(mYtd);
        setRowingMetersAll(mAll);

        setWalkingMilesWeek(wWeek);
        setWalkingMilesMonth(wMonth);
        setWalkingMilesYtd(wYtd);
        setWalkingMilesAll(wAll);

        setRunningMilesWeek(rWeek);
        setRunningMilesMonth(rMonth);
        setRunningMilesYtd(rYtd);
        setRunningMilesAll(rAll);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [fromKey, toKey, now, month]);

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

  const { weekFromKey, weekToKey } = useMemo(() => {
    const { start, end } = weekBounds(now);
    return {
      weekFromKey: format(start, "yyyy-MM-dd"),
      weekToKey: format(end, "yyyy-MM-dd"),
    };
  }, [now]);

  const rowingCountThisWeek = useMemo(() => {
    return logs.filter(
      (l) => l.date >= weekFromKey && l.date <= weekToKey && !!l.did_rowing
    ).length;
  }, [logs, weekFromKey, weekToKey]);

  const neuroItemId = useMemo(() => {
    const neuro = routineItems.find((i) => i.label.toLowerCase().includes("neuro"));
    return neuro?.id ?? null;
  }, [routineItems]);

  const neuroCountThisWeek = useMemo(() => {
    if (!neuroItemId) return 0;
    const dates = new Set<string>();
    for (const c of checks) {
      if (
        c.date >= weekFromKey &&
        c.date <= weekToKey &&
        c.routine_item_id === neuroItemId &&
        c.done
      ) {
        dates.add(c.date);
      }
    }
    return dates.size;
  }, [checks, neuroItemId, weekFromKey, weekToKey]);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Progress</h1>
        <p className="text-sm text-neutral-400">
          Tap a day to edit it. Green/yellow/red is based on your non-negotiables.
        </p>
        {error ? <p className="text-xs text-rose-300">Error: {error}</p> : null}
        {!error ? (
          <p className="text-[11px] text-neutral-500">
            Debug: week {rowingMetersWeek.toLocaleString()}m, month {rowingMetersMonth.toLocaleString()}m
          </p>
        ) : null}
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10"
            onClick={() => setMonth((m) => prevMonth(m))}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-sm font-semibold">{monthLabel(month)}</div>
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10"
            onClick={() => setMonth((m) => nextMonth(m))}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[11px] text-neutral-500">
          {["M", "T", "W", "T", "F", "S", "S"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {days.map((d) => {
            const dk = format(d, "yyyy-MM-dd");
            const inMonth = isSameMonth(d, month);
            const color: DayColor = loading
              ? "empty"
              : computeDayColor({
                  dateKey: dk,
                  routineItems,
                  checks: checksByDate.get(dk) ?? [],
                  log: logMap.get(dk) ?? null,
                });

            return (
              <Link
                key={dk}
                href={`/app/routines/edit/${dk}`}
                className={`flex flex-col items-center gap-1 ${
                  inMonth ? "" : "opacity-40"
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-xl border border-white/10 ${dotClasses(
                    color
                  )}`}
                />
                <div className="text-[10px] text-neutral-500">{format(d, "d")}</div>
              </Link>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-400">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded bg-emerald-500/80" /> Green:
            hit non-negotiables
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded bg-amber-400/80" /> Yellow:
            missed 1
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded bg-rose-500/80" /> Red:
            missed 2+
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
        <div>
          <h2 className="text-base font-medium">Weekly goals (Mon–Sun)</h2>
          <p className="mt-1 text-sm text-neutral-400">Ideal is 5x/week. Minimum is 3x/week.</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-neutral-400">Rowing sessions</p>
            <p className="mt-1 text-lg font-semibold">
              {rowingCountThisWeek}/5
              <span
                className={
                  rowingCountThisWeek >= 3
                    ? "ml-2 rounded-full bg-emerald-500/20 px-2 py-1 text-[11px] font-semibold text-emerald-200"
                    : "ml-2 rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-neutral-300"
                }
              >
                min 3
              </span>
            </p>
            <p className="mt-1 text-xs text-neutral-500">Meters this week: {Math.round(rowingMetersWeek).toLocaleString()}</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-neutral-400">Neurofeedback sessions</p>
            <p className="mt-1 text-lg font-semibold">
              {neuroCountThisWeek}/5
              <span
                className={
                  neuroCountThisWeek >= 3
                    ? "ml-2 rounded-full bg-emerald-500/20 px-2 py-1 text-[11px] font-semibold text-emerald-200"
                    : "ml-2 rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-neutral-300"
                }
              >
                min 3
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-neutral-400">Rowing meters (month)</p>
            <p className="mt-1 text-lg font-semibold">
              {Math.round(rowingMetersMonth).toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              YTD: {Math.round(rowingMetersYtd).toLocaleString()} (All: {Math.round(rowingMetersAll).toLocaleString()})
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-neutral-400">Walking miles (week/month)</p>
            <p className="mt-1 text-lg font-semibold">
              {walkingMilesWeek.toFixed(1)} / {walkingMilesMonth.toFixed(1)}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              YTD: {walkingMilesYtd.toFixed(1)} (All: {walkingMilesAll.toFixed(1)})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-neutral-400">Running miles (week/month)</p>
            <p className="mt-1 text-lg font-semibold">
              {runningMilesWeek.toFixed(1)} / {runningMilesMonth.toFixed(1)}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              YTD: {runningMilesYtd.toFixed(1)} (All: {runningMilesAll.toFixed(1)})
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-neutral-400">Quick log</p>
            <a
              className="mt-2 inline-block rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
              href="/app/cardio"
            >
              Log miles
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
