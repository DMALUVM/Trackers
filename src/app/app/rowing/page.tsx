export default function RowingPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Rowing</h1>
        <p className="text-sm text-neutral-600">Goal: 20 minutes, 5x/week.</p>
      </header>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-base font-medium">Log a session</h2>
        <p className="mt-1 text-sm text-neutral-600">
          We’ll optimize this for 10-second entry.
        </p>

        <div className="mt-4 grid gap-3">
          <label className="text-sm font-medium">Time (minutes)</label>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            type="number"
            min={0}
            step={0.1}
            placeholder="20"
          />

          <button className="mt-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">
            Save session
          </button>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-base font-medium">Progress</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Weekly streaks and goal tracking coming next.
        </p>
      </section>
    </div>
  );
}
