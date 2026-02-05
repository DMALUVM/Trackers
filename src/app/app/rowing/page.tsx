"use client";

import { useEffect, useMemo, useState } from "react";
import { Timer, Zap, Ruler } from "lucide-react";
import { format, startOfMonth, startOfWeek, startOfYear } from "date-fns";
import { toDateKey } from "@/lib/supabaseData";
import { addActivityLog, sumActivity } from "@/lib/activity";

export default function RowingPage() {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [minutes, setMinutes] = useState<string>("");
  const [meters, setMeters] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [totals, setTotals] = useState<{ wtd: number; mtd: number; ytd: number; all: number; minWtd: number; minMtd: number; minYtd: number; minAll: number } | null>(null);

  async function refreshTotals() {
    const now = new Date();
    const fromW = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const fromM = format(startOfMonth(now), "yyyy-MM-dd");
    const fromY = format(startOfYear(now), "yyyy-MM-dd");
    const to = format(now, "yyyy-MM-dd");

    const [wtd, mtd, ytd, all, minWtd, minMtd, minYtd, minAll] = await Promise.all([
      sumActivity({ from: fromW, to, activityKey: "rowing", unit: "meters" }),
      sumActivity({ from: fromM, to, activityKey: "rowing", unit: "meters" }),
      sumActivity({ from: fromY, to, activityKey: "rowing", unit: "meters" }),
      sumActivity({ from: "2000-01-01", to, activityKey: "rowing", unit: "meters" }),
      sumActivity({ from: fromW, to, activityKey: "rowing", unit: "minutes" }),
      sumActivity({ from: fromM, to, activityKey: "rowing", unit: "minutes" }),
      sumActivity({ from: fromY, to, activityKey: "rowing", unit: "minutes" }),
      sumActivity({ from: "2000-01-01", to, activityKey: "rowing", unit: "minutes" }),
    ]);

    setTotals({ wtd, mtd, ytd, all, minWtd, minMtd, minYtd, minAll });
  }

  useEffect(() => {
    void refreshTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const save = async () => {
    setStatus("Saving...");
    try {
      const m = meters.trim() ? Number(meters) : NaN;
      if (!Number.isFinite(m) || m <= 0) {
        setStatus("Please enter meters (e.g., 5000). ");
        return;
      }

      const min = minutes.trim() ? Number(minutes) : null;

      await addActivityLog({
        dateKey: todayKey,
        activityKey: "rowing",
        value: m,
        unit: "meters",
      });

      if (min && Number.isFinite(min) && min > 0) {
        await addActivityLog({
          dateKey: todayKey,
          activityKey: "rowing",
          value: min,
          unit: "minutes",
        });
      }

      setStatus("Saved.");
      setMeters("");
      setMinutes("");
      void refreshTotals();
      setTimeout(() => setStatus(""), 1200);
    } catch (e: any) {
      setStatus(`Save failed: ${e?.message ?? String(e)}`);
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Rowing</h1>
        <p className="text-sm text-neutral-400">Goal: 5x/week (min 3x).</p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">Log session</h2>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-neutral-200">
            <Zap size={14} /> 10-sec entry
          </span>
        </div>

        <div className="mt-4 grid gap-2">
          <label className="text-xs font-medium text-neutral-300">Meters</label>
          <div className="relative">
            <Ruler size={16} className="absolute left-3 top-3.5 text-neutral-500" />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 pl-9 pr-3 py-3 text-base text-white placeholder:text-neutral-500"
              type="number"
              min={0}
              step={1}
              placeholder="5000"
              inputMode="numeric"
              value={meters}
              onChange={(e) => setMeters(e.target.value)}
            />
          </div>

          <label className="mt-2 text-xs font-medium text-neutral-300">
            Time (minutes, optional)
          </label>
          <div className="relative">
            <Timer size={16} className="absolute left-3 top-3.5 text-neutral-500" />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 pl-9 pr-3 py-3 text-base text-white placeholder:text-neutral-500"
              type="number"
              min={0}
              step={0.1}
              placeholder="20"
              inputMode="decimal"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </div>

          <button
            className="mt-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"
            onClick={save}
            type="button"
          >
            Save
          </button>

          {status ? <p className="text-xs text-neutral-400">{status}</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div>
          <h2 className="text-base font-medium">Totals</h2>
          <p className="mt-1 text-sm text-neutral-400">WTD / MTD / YTD / All time</p>
        </div>

        {totals ? (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-500">WTD</p>
              <p className="mt-1 font-semibold text-white">{Math.round(totals.wtd).toLocaleString()} m</p>
              <p className="text-xs text-neutral-400">{Math.round(totals.minWtd).toLocaleString()} min</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-500">MTD</p>
              <p className="mt-1 font-semibold text-white">{Math.round(totals.mtd).toLocaleString()} m</p>
              <p className="text-xs text-neutral-400">{Math.round(totals.minMtd).toLocaleString()} min</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-500">YTD</p>
              <p className="mt-1 font-semibold text-white">{Math.round(totals.ytd).toLocaleString()} m</p>
              <p className="text-xs text-neutral-400">{Math.round(totals.minYtd).toLocaleString()} min</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-500">All time</p>
              <p className="mt-1 font-semibold text-white">{Math.round(totals.all).toLocaleString()} m</p>
              <p className="text-xs text-neutral-400">{Math.round(totals.minAll).toLocaleString()} min</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-400">Loading totals…</p>
        )}

        <div className="flex gap-2">
          <a
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-white/10"
            href="/app/rowing/history"
          >
            History
          </a>
        </div>
      </section>
    </div>
  );
}
