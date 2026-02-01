import { Timer, Zap } from "lucide-react";

export default function RowingPage() {
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Rowing</h1>
        <p className="text-sm text-neutral-400">Goal: 20 minutes, 5x/week.</p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">Log session</h2>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-neutral-200">
            <Timer size={14} /> 10-sec entry
          </span>
        </div>

        <div className="mt-4 grid gap-2">
          <label className="text-xs font-medium text-neutral-300">Time (minutes)</label>
          <input
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-base text-white placeholder:text-neutral-500"
            type="number"
            min={0}
            step={0.1}
            placeholder="20"
            inputMode="decimal"
          />
          <button className="mt-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black">
            Save
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-neutral-400">
          <Zap size={14} className="text-emerald-400" />
          <span>We’ll add weekly goal progress + streaks here.</span>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-medium">Progress</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Weekly and monthly summaries coming next.
        </p>
      </section>
    </div>
  );
}
