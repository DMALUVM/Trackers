"use client";

import { format, isSameMonth } from "date-fns";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { computeDayColor, type DayColor } from "@/lib/progress";
import { monthGridDates, monthLabel, nextMonth, prevMonth } from "@/lib/calendar";
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

  const [month, setMonth] = useState<Date>(now);
  const [routineItems, setRoutineItems] = useState<RoutineItemRow[]>([]);
  const [logs, setLogs] = useState<DailyLogRow[]>([]);
  const [checks, setChecks] = useState<
    Array<{ date: string; routine_item_id: string; done: boolean }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

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
        const [items, dataRange] = await Promise.all([
          listRoutineItems(),
          loadRangeStates({ from: fromKey, to: toKey }),
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

  const rowingCountThisWeek = useMemo(() => {
    // simple: count did_rowing within the loaded range that overlaps current week
    const weekStart = new Date();
    // weekStart/End already handled by compute page earlier; keep for now as a placeholder
    return logs.filter((l) => l.did_rowing).length;
  }, [logs]);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Progress</h1>
        <p className="text-sm text-neutral-400">
          Tap a day to edit it. Green/yellow/red is based on your non-negotiables.
        </p>
        {error ? <p className="text-xs text-rose-300">Error: {error}</p> : null}
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

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-medium">Weekly goals</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Rowing this loaded range: {rowingCountThisWeek} (weekly calc refinement next).
        </p>
      </section>
    </div>
  );
}
