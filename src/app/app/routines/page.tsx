import { Flame, Plane, ThermometerSnowflake } from "lucide-react";

const todayItems = [
  { label: "Morning: Nattokinase", done: false },
  { label: "Morning: Lymphatic flow routine", done: false },
  { label: "Morning: Workout", done: false },
  { label: "Morning: Collagen + creatine", done: false },
  { label: "Anytime: Breathwork", done: false },
  { label: "Anytime: Rowing (20 min)", done: false },
  { label: "Night: Magnesium", done: false },
] as const;

export default function RoutinesPage() {
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Routines</h1>
        <p className="text-sm text-neutral-400">
          Fast check-in. Calendar and stats next.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-medium">Today</h2>
            <p className="mt-1 text-xs text-neutral-400">Normal day</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <Flame size={16} className="text-orange-400" />
            <span>Streak: —</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {todayItems.map((item) => (
            <button
              key={item.label}
              className="group w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-neutral-100 transition-colors hover:bg-white/10"
            >
              <div className="flex items-center justify-between gap-3">
                <span>{item.label}</span>
                <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-neutral-300 group-hover:bg-white/15">
                  Tap
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black">
            Save
          </button>
          <button className="rounded-xl border border-white/15 bg-transparent px-4 py-2.5 text-sm font-medium text-white">
            Edit day mode
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-neutral-300 hover:bg-white/10">
            <Plane size={16} /> Travel day
          </button>
          <button className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-neutral-300 hover:bg-white/10">
            <ThermometerSnowflake size={16} /> Sick day
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-medium">Progress</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Weekly, monthly, and YTD cards plus a calendar heatmap will live here.
        </p>
      </section>
    </div>
  );
}
