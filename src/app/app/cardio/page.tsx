"use client";

import { useMemo, useState } from "react";
import { Footprints, PersonStanding, Ruler } from "lucide-react";
import { toDateKey } from "@/lib/supabaseData";
import { addActivityLog, type ActivityKey } from "@/lib/activity";

export default function CardioPage() {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [activity, setActivity] = useState<ActivityKey>("walking");
  const [miles, setMiles] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const save = async () => {
    setStatus("Saving...");
    try {
      const v = miles.trim() ? Number(miles) : NaN;
      if (!Number.isFinite(v) || v <= 0) {
        setStatus("Please enter miles (e.g., 2.5). ");
        return;
      }

      await addActivityLog({
        dateKey: todayKey,
        activityKey: activity,
        value: v,
        unit: "miles",
      });

      setStatus("Saved.");
      setMiles("");
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
          <label className="text-xs font-medium text-neutral-300">Miles</label>
          <div className="relative">
            <Ruler size={16} className="absolute left-3 top-3.5 text-neutral-500" />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 pl-9 pr-3 py-3 text-base text-white placeholder:text-neutral-500"
              type="number"
              min={0}
              step={0.1}
              placeholder="2.5"
              inputMode="decimal"
              value={miles}
              onChange={(e) => setMiles(e.target.value)}
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
    </div>
  );
}
