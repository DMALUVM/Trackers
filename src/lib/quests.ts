import { format, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { sumActivity } from "@/lib/activity";
import type { DayColor } from "@/lib/progress";

export type Quest = {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  progressText: string;
  pct: number; // 0..100
};

function clampPct(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

export async function buildWeeklyQuests(opts: {
  dateKey: string;
  greenDaysWtd: number;
}) {
  const now = new Date(opts.dateKey + "T12:00:00");
  const fromW = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const to = format(now, "yyyy-MM-dd");

  // Targets (MVP). We'll make these user-configurable later.
  const targets = {
    rowingMeters: 15000,
    walkingSteps: 40000,
    runningMiles: 6,
    recoverySessions: 3,
    greenDays: 5,
  };

  const [row, steps, run, sauna, cold] = await Promise.all([
    sumActivity({ from: fromW, to, activityKey: "rowing", unit: "meters" }),
    sumActivity({ from: fromW, to, activityKey: "walking", unit: "steps" }),
    sumActivity({ from: fromW, to, activityKey: "running", unit: "miles" }),
    sumActivity({ from: fromW, to, activityKey: "sauna", unit: "sessions" }),
    sumActivity({ from: fromW, to, activityKey: "cold", unit: "sessions" }),
  ]);

  const recovery = Number(sauna) + Number(cold);

  const quests: Quest[] = [
    {
      id: "q-rowing",
      emoji: "🚣",
      title: "Rowing meters",
      desc: `Hit ${targets.rowingMeters.toLocaleString()}m this week`,
      progressText: `${Math.round(row).toLocaleString()} / ${targets.rowingMeters.toLocaleString()} m`,
      pct: clampPct((Number(row) / targets.rowingMeters) * 100),
    },
    {
      id: "q-walk",
      emoji: "🚶",
      title: "Walking steps",
      desc: `Hit ${targets.walkingSteps.toLocaleString()} steps this week`,
      progressText: `${Math.round(steps).toLocaleString()} / ${targets.walkingSteps.toLocaleString()}`,
      pct: clampPct((Number(steps) / targets.walkingSteps) * 100),
    },
    {
      id: "q-recovery",
      emoji: "🔥",
      title: "Recovery",
      desc: `Do ${targets.recoverySessions} sauna/cold sessions this week`,
      progressText: `${Math.round(recovery)} / ${targets.recoverySessions} sessions`,
      pct: clampPct((Number(recovery) / targets.recoverySessions) * 100),
    },
    {
      id: "q-green",
      emoji: "✅",
      title: "Green days",
      desc: `Get ${targets.greenDays} green days this week`,
      progressText: `${opts.greenDaysWtd} / ${targets.greenDays} days`,
      pct: clampPct((opts.greenDaysWtd / targets.greenDays) * 100),
    },
  ];

  // Return the top 3 most relevant (highest progress but not complete, then highest)
  const ordered = [...quests].sort((a, b) => {
    const ac = a.pct >= 100 ? 1 : 0;
    const bc = b.pct >= 100 ? 1 : 0;
    if (ac !== bc) return ac - bc; // incomplete first
    return b.pct - a.pct;
  });

  return ordered.slice(0, 3);
}

export function greenDaysWtd(colors: Array<{ dateKey: string; color: DayColor }>) {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const startKey = format(start, "yyyy-MM-dd");
  return colors.filter((d) => d.dateKey >= startKey && d.color === "green").length;
}
