import { format, startOfWeek } from "date-fns";
import { sumActivity } from "@/lib/activity";
import type { DayColor } from "@/lib/progress";
import { loadQuestConfig, type BuiltinQuestId, type CustomQuest } from "@/lib/questsConfig";

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
  // custom streak quests need access to daily routine label checks
  didKeyword?: (dateKey: string, keywords: string[]) => boolean;
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

  const builtins: Record<BuiltinQuestId, Quest> = {
    "q-rowing": {
      id: "q-rowing",
      emoji: "🚣",
      title: "Rowing meters",
      desc: `Hit ${targets.rowingMeters.toLocaleString()}m this week`,
      progressText: `${Math.round(row).toLocaleString()} / ${targets.rowingMeters.toLocaleString()} m`,
      pct: clampPct((Number(row) / targets.rowingMeters) * 100),
    },
    "q-walk": {
      id: "q-walk",
      emoji: "🚶",
      title: "Walking steps",
      desc: `Hit ${targets.walkingSteps.toLocaleString()} steps this week`,
      progressText: `${Math.round(steps).toLocaleString()} / ${targets.walkingSteps.toLocaleString()}`,
      pct: clampPct((Number(steps) / targets.walkingSteps) * 100),
    },
    "q-run": {
      id: "q-run",
      emoji: "🏃",
      title: "Running miles",
      desc: `Hit ${targets.runningMiles} mi this week`,
      progressText: `${Number(run).toFixed(1)} / ${targets.runningMiles.toFixed(1)} mi`,
      pct: clampPct((Number(run) / targets.runningMiles) * 100),
    },
    "q-recovery": {
      id: "q-recovery",
      emoji: "🔥",
      title: "Recovery",
      desc: `Do ${targets.recoverySessions} sauna/cold sessions this week`,
      progressText: `${Math.round(recovery)} / ${targets.recoverySessions} sessions`,
      pct: clampPct((Number(recovery) / targets.recoverySessions) * 100),
    },
    "q-green": {
      id: "q-green",
      emoji: "✅",
      title: "Green days",
      desc: `Get ${targets.greenDays} green days this week`,
      progressText: `${opts.greenDaysWtd} / ${targets.greenDays} days`,
      pct: clampPct((opts.greenDaysWtd / targets.greenDays) * 100),
    },
  };

  const cfg = loadQuestConfig();
  if (!cfg.enabled || cfg.maxShown === 0) return [];

  const selectedBuiltins = (cfg.selected ?? []).map((id) => builtins[id]).filter(Boolean);

  const customToQuests = (custom: CustomQuest[]): Quest[] => {
    const didKeyword = opts.didKeyword;
    if (!didKeyword) return [];

    const streakFor = (keywords: string[]) => {
      let s = 0;
      // walk backward from today
      const daysBack = 60;
      for (let i = 0; i <= daysBack; i++) {
        const dk = format(new Date(opts.dateKey + "T12:00:00"), "yyyy-MM-dd");
        // compute dateKey i days back
        const d = new Date(dk + "T12:00:00");
        d.setDate(d.getDate() - i);
        const key = format(d, "yyyy-MM-dd");
        if (!didKeyword(key, keywords)) break;
        s += 1;
      }
      return s;
    };

    return custom.map((c) => {
      const s = streakFor(c.keywords);
      return {
        id: c.id,
        emoji: c.emoji || "⭐",
        title: c.title,
        desc: "Consecutive days",
        progressText: `${s} day streak`,
        pct: clampPct(Math.min(100, s * 20)),
      };
    });
  };

  const quests: Quest[] = [...selectedBuiltins, ...customToQuests(cfg.custom ?? [])];

  // Order: incomplete first, then highest pct
  const ordered = [...quests].sort((a, b) => {
    const ac = a.pct >= 100 ? 1 : 0;
    const bc = b.pct >= 100 ? 1 : 0;
    if (ac !== bc) return ac - bc;
    return b.pct - a.pct;
  });

  return ordered.slice(0, cfg.maxShown);
}

export function greenDaysWtd(colors: Array<{ dateKey: string; color: DayColor }>) {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const startKey = format(start, "yyyy-MM-dd");
  return colors.filter((d) => d.dateKey >= startKey && d.color === "green").length;
}
