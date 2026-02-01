export default function NeuroPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Neurofeedback</h1>
        <p className="text-sm text-neutral-600">
          Track session completion and a quick note on how you felt.
        </p>
      </header>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-base font-medium">Today</h2>

        <div className="mt-4 grid gap-3">
          <label className="text-sm font-medium">Session</label>
          <select className="w-full rounded-lg border px-3 py-2 text-sm">
            <option>Not done</option>
            <option>Done</option>
          </select>

          <label className="text-sm font-medium">Notes (optional)</label>
          <textarea
            className="w-full rounded-lg border px-3 py-2 text-sm"
            rows={5}
            placeholder="Sleep, mood, focus, anything notable..."
          />

          <button className="mt-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">
            Save
          </button>
        </div>
      </section>
    </div>
  );
}
