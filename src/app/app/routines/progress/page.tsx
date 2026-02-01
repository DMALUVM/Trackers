"use client";

import {
  addDays,
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { computeDayColor, type DayColor } from "@/lib/progress";
import { listRoutineItems, loadRangeStates } from "@/lib/supabaseData";
import type { DailyLogRow, RoutineItemRow } from "@/lib/types";

function dotClasses(color: DayColor) {
  if (color === "green") return "bg-emerald-500/80";
  if (color === "yellow") return "bg-amber-400/80";
  if (color === "red") return "bg-rose-500/80";
  return "bg-white/5";
}

export default function RoutinesProgressPage() {
  const now = useMemo(() => new Date(), []);

  // IMPORTANT: memoize range boundaries so effects don't retrigger every render
  const range = useMemo(() => {
    const start = startOfMonth(subMonths(now, 1));
    const end = endOfMonth(now);
    return {
      start,
      end,
      fromKey: format(start, "yyyy-MM-dd"),
      toKey: format(end, "yyyy-MM-dd"),
    };
  }, [now]);

  const days: Date[] = [];
  for (let d = range.start; d <= range.end; d = addDays(d, 1)) days.push(d);

  const [routineItems, setRoutineItems] = useState<RoutineItemRow[]>([]);
  const [logs, setLogs] = useState<DailyLogRow[]>([]);
  const [checks, setChecks] = useState<
    Array<{ date: string; routine_item_id: string; done: boolean }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const [items, dataRange] = await Promise.all([
          listRoutineItems(),
          loadRangeStates({ from: range.fromKey, to: range.toKey }),
        ]);
        setRoutineItems(items);
        setLogs(dataRange.logs);
        setChecks(dataRange.checks);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [range.fromKey, range.toKey]);

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

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const rowingCountThisWeek = useMemo(() => {
    const from = format(weekStart, "yyyy-MM-dd");
    const to = format(weekEnd, "yyyy-MM-dd");
    return logs.filter((l) => l.date >= from && l.date <= to && l.did_rowing)
      .length;
  }, [logs, weekStart, weekEnd]);

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const monthColors = useMemo(() => {
    const from = format(monthStart, "yyyy-MM-dd");
    const to = format(monthEnd, "yyyy-MM-dd");
    const monthDays = days.filter(
      (d) => format(d, "yyyy-MM-dd") >= from && format(d, "yyyy-MM-dd") <= to
    );
    return monthDays.map((d) => {
      const dk = format(d, "yyyy-MM-dd");
      return computeDayColor({
        dateKey: dk,
        routineItems,
        checks: checksByDate.get(dk) ?? [],
        log: logMap.get(dk) ?? null,
      });
    });
  }, [days, monthStart, monthEnd, routineItems, checksByDate, logMap]);

  const metNonnegThisMonth = monthColors.filter((c) => c === "green").length;

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Progress</h1>
        <p className="text-sm text-neutral-400">
          Calendar heatmap + weekly goals. Green/yellow/red is based on your
          non-negotiables.
        </p>
        {error ? (
          <p className="text-xs text-rose-300">Error: {error}</p>
        ) : null}
      </header>

      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-neutral-400">Rowing (this week)</p>
          <p className="mt-1 text-lg font-semibold">{rowingCountThisWeek}/5</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-neutral-400">Green days (this month)</p>
          <p className="mt-1 text-lg font-semibold">
            {loading ? "…" : metNonnegThisMonth}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-neutral-400">YTD</p>
          <p className="mt-1 text-lg font-semibold">(next)</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">Calendar</h2>
          <p className="text-xs text-neutral-400">{format(now, "yyyy")}</p>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[11px] text-neutral-500">
          {["M", "T", "W", "T", "F", "S", "S"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {days.map((d) => {
            const dk = format(d, "yyyy-MM-dd");
            const color: DayColor = loading
              ? "empty"
              : computeDayColor({
                  dateKey: dk,
                  routineItems,
                  checks: checksByDate.get(dk) ?? [],
                  log: logMap.get(dk) ?? null,
                });

            return (
              <div key={dk} className="flex flex-col items-center gap-1">
                <div
                  className={`h-9 w-9 rounded-xl border border-white/10 ${dotClasses(
                    color
                  )}`}
                  title={dk}
                />
                <div className="text-[10px] text-neutral-500">{format(d, "d")}</div>
              </div>
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

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-medium">Weekly goals</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Week runs Mon–Sun. Missing a day is fine, only the weekly total matters.
        </p>
      </section>
    </div>
  );
}
