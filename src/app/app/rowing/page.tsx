"use client";

import { useMemo, useState } from "react";
import { Timer, Zap, Ruler } from "lucide-react";
import { toDateKey } from "@/lib/supabaseData";
import { addActivityLog } from "@/lib/activity";

export default function RowingPage() {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [minutes, setMinutes] = useState<string>("");
  const [meters, setMeters] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const save = async () => {
    setStatus("Saving...");
    try {
      const m = meters.trim() ? Number(meters) : NaN;
      if (!Number.isFinite(m) || m <= 0) {
        setStatus("Please enter meters (e.g., 5000). ");
        return;
      }

      const min = minutes.trim() ? Number(minutes) : null;
      const notes = min && Number.isFinite(min) ? `time_min:${min}` : null;

      await addActivityLog({
        dateKey: todayKey,
        activityKey: "rowing",
        value: m,
        unit: "meters",
        notes,
      });

      setStatus("Saved.");
      setMeters("");
      setMinutes("");
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
          <p className="mt-1 text-sm text-neutral-400">View totals in Progress.</p>
        </div>
        <div className="flex gap-2">
          <a
            className="flex-1 rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold text-black"
            href="/app/routines/progress"
          >
            Open Progress
          </a>
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
