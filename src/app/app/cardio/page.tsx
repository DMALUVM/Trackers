"use client";

import { useEffect, useMemo, useState } from "react";
import { Footprints, PersonStanding, Ruler } from "lucide-react";
import { format, startOfMonth, startOfWeek, startOfYear } from "date-fns";
import { toDateKey } from "@/lib/supabaseData";
import { addActivityLog, sumActivity, type ActivityKey } from "@/lib/activity";

export default function CardioPage() {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [activity, setActivity] = useState<ActivityKey>("walking");
  const [miles, setMiles] = useState<string>("");
  const [steps, setSteps] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [totals, setTotals] = useState<{ runWtd: number; runMtd: number; runYtd: number; runAll: number; walkWtd: number; walkMtd: number; walkYtd: number; walkAll: number } | null>(null);

  async function refreshTotals() {
    const now = new Date();
    const fromW = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const fromM = format(startOfMonth(now), "yyyy-MM-dd");
    const fromY = format(startOfYear(now), "yyyy-MM-dd");
    const to = format(now, "yyyy-MM-dd");

    const [runWtd, runMtd, runYtd, runAll, walkWtd, walkMtd, walkYtd, walkAll] = await Promise.all([
      sumActivity({ from: fromW, to, activityKey: "running", unit: "miles" }),
      sumActivity({ from: fromM, to, activityKey: "running", unit: "miles" }),
      sumActivity({ from: fromY, to, activityKey: "running", unit: "miles" }),
      sumActivity({ from: "2000-01-01", to, activityKey: "running", unit: "miles" }),
      sumActivity({ from: fromW, to, activityKey: "walking", unit: "steps" }),
      sumActivity({ from: fromM, to, activityKey: "walking", unit: "steps" }),
      sumActivity({ from: fromY, to, activityKey: "walking", unit: "steps" }),
      sumActivity({ from: "2000-01-01", to, activityKey: "walking", unit: "steps" }),
    ]);

    setTotals({ runWtd, runMtd, runYtd, runAll, walkWtd, walkMtd, walkYtd, walkAll });
  }

  useEffect(() => {
    void refreshTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setStatus("Saving...");
    try {
      if (activity === "walking") {
        const v = steps.trim() ? Number(steps) : NaN;
        if (!Number.isFinite(v) || v <= 0) {
          setStatus("Please enter steps (e.g., 8500). ");
          return;
        }

        await addActivityLog({
          dateKey: todayKey,
          activityKey: "walking",
          value: Math.round(v),
          unit: "steps",
        });

        setStatus("Saved.");
        setSteps("");
        void refreshTotals();
        setTimeout(() => setStatus(""), 1200);
        return;
      }

      const v = miles.trim() ? Number(miles) : NaN;
      if (!Number.isFinite(v) || v <= 0) {
        setStatus("Please enter miles (e.g., 2.5). ");
        return;
      }

      await addActivityLog({
        dateKey: todayKey,
        activityKey: "running",
        value: v,
        unit: "miles",
      });

      setStatus("Saved.");
      setMiles("");
      void refreshTotals();
      setTimeout(() => setStatus(""), 1200);
    } catch (e: any) {
      setStatus(`Save failed: ${e?.message ?? String(e)}`);
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Cardio</h1>
        <p className="text-sm text-neutral-400">Log walking or running miles.</p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-neutral-300">Activity</label>
          <a
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
            href="/app/cardio/history"
          >
            History
          </a>
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className={
              activity === "walking"
                ? "flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"
                : "flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10"
            }
            onClick={() => setActivity("walking")}
          >
            <span className="inline-flex items-center gap-2">
              <Footprints size={16} /> Walking
            </span>
          </button>
          <button
            type="button"
            className={
              activity === "running"
                ? "flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"
                : "flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10"
            }
            onClick={() => setActivity("running")}
          >
            <span className="inline-flex items-center gap-2">
              <PersonStanding size={16} /> Running
            </span>
          </button>
        </div>

        <div className="mt-4 grid gap-2">
          <label className="text-xs font-medium text-neutral-300">
            {activity === "walking" ? "Steps" : "Miles"}
          </label>
          <div className="relative">
            <Ruler size={16} className="absolute left-3 top-3.5 text-neutral-500" />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 pl-9 pr-3 py-3 text-base text-white placeholder:text-neutral-500"
              type="number"
              min={0}
              step={activity === "walking" ? 1 : 0.1}
              placeholder={activity === "walking" ? "8500" : "2.5"}
              inputMode={activity === "walking" ? "numeric" : "decimal"}
              value={activity === "walking" ? steps : miles}
              onChange={(e) => (activity === "walking" ? setSteps(e.target.value) : setMiles(e.target.value))}
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
              <p className="text-xs text-neutral-500">Running WTD</p>
              <p className="mt-1 font-semibold text-white">{totals.runWtd.toFixed(1)} mi</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-500">Walking WTD</p>
              <p className="mt-1 font-semibold text-white">{Math.round(totals.walkWtd).toLocaleString()} steps</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-500">Running MTD</p>
              <p className="mt-1 font-semibold text-white">{totals.runMtd.toFixed(1)} mi</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-500">Walking MTD</p>
              <p className="mt-1 font-semibold text-white">{Math.round(totals.walkMtd).toLocaleString()} steps</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-500">Running YTD</p>
              <p className="mt-1 font-semibold text-white">{totals.runYtd.toFixed(1)} mi</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-500">Walking YTD</p>
              <p className="mt-1 font-semibold text-white">{Math.round(totals.walkYtd).toLocaleString()} steps</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-500">Running All time</p>
              <p className="mt-1 font-semibold text-white">{totals.runAll.toFixed(1)} mi</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-500">Walking All time</p>
              <p className="mt-1 font-semibold text-white">{Math.round(totals.walkAll).toLocaleString()} steps</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-400">Loading totals…</p>
        )}
      </section>
    </div>
  );
}
