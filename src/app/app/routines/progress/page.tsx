import { addDays, endOfMonth, format, startOfMonth, subMonths } from "date-fns";

type DayColor = "green" | "yellow" | "red" | "empty";

// Temporary placeholder: until Supabase is wired, we can’t compute real history.
function colorForDay(_date: Date): DayColor {
  return "empty";
}

function dotClasses(color: DayColor) {
  if (color === "green") return "bg-emerald-500/80";
  if (color === "yellow") return "bg-amber-400/80";
  if (color === "red") return "bg-rose-500/80";
  return "bg-white/5";
}

export default function RoutinesProgressPage() {
  const now = new Date();
  const start = startOfMonth(subMonths(now, 1));
  const end = endOfMonth(now);

  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Progress</h1>
        <p className="text-sm text-neutral-400">
          Calendar heatmap + weekly/monthly/YTD cards. (History will populate once
          Supabase persistence is wired.)
        </p>
      </header>

      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-neutral-400">This week</p>
          <p className="mt-1 text-lg font-semibold">—</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-neutral-400">This month</p>
          <p className="mt-1 text-lg font-semibold">—</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-neutral-400">YTD</p>
          <p className="mt-1 text-lg font-semibold">—</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">Calendar</h2>
          <p className="text-xs text-neutral-400">{format(now, "yyyy")}</p>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[11px] text-neutral-500">
          {['M','T','W','T','F','S','S'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {days.map((d) => {
            const color = colorForDay(d);
            return (
              <div
                key={d.toISOString()}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className={`h-9 w-9 rounded-xl border border-white/10 ${dotClasses(
                    color
                  )}`}
                />
                <div className="text-[10px] text-neutral-500">
                  {format(d, "d")}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-400">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded bg-emerald-500/80" /> Green:
            hit non-negotiables
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded bg-amber-400/80" /> Yellow:
            missed 1
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded bg-rose-500/80" /> Red:
            missed 2+
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-medium">Weekly goals</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Rowing 5x/week will show here. Missing a day won’t hurt, only the
          Mon–Sun total.
        </p>
      </section>
    </div>
  );
}
