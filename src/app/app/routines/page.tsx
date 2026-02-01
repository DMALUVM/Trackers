export default function RoutinesPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Routines</h1>
        <p className="text-sm text-neutral-600">
          Fast daily check-in. Calendar + weekly/monthly/YTD stats coming next.
        </p>
      </header>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">Today</h2>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700">
            Normal day
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <button className="w-full rounded-lg border px-4 py-3 text-left text-sm hover:bg-neutral-50">
            Placeholder checklist item (we’ll import your real list)
          </button>
          <button className="w-full rounded-lg border px-4 py-3 text-left text-sm hover:bg-neutral-50">
            Placeholder checklist item
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button className="flex-1 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">
            Save
          </button>
          <button className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium">
            Travel / Sick
          </button>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-base font-medium">Progress</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Weekly, monthly, and YTD summaries will live here.
        </p>
      </section>
    </div>
  );
}
