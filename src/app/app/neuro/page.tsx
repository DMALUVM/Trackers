export default function NeuroPage() {
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Neurofeedback</h1>
        <p className="text-sm text-neutral-400">
          Session done + quick notes on how you felt.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-medium">Today</h2>

        <div className="mt-4 grid gap-3">
          <label className="text-xs font-medium text-neutral-300">Session</label>
          <select className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white">
            <option>Not done</option>
            <option>Done</option>
          </select>

          <label className="text-xs font-medium text-neutral-300">Notes (optional)</label>
          <textarea
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white placeholder:text-neutral-500"
            rows={6}
            placeholder="Sleep, mood, focus, anything notable..."
          />

          <button className="mt-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black">
            Save
          </button>
        </div>
      </section>
    </div>
  );
}
