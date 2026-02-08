"use client";

import { useEffect, useState } from "react";
import { loadRangeStates, listRoutineItems, toDateKey, getUserId } from "@/lib/supabaseData";
import { supabase } from "@/lib/supabaseClient";
import type { RoutineItemRow, DailyLogRow } from "@/lib/types";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export type InsightType =
  | "day_of_week"
  | "sleep_correlation"
  | "best_habit"
  | "worst_habit"
  | "trend"
  | "consistency"
  | "time_of_week"
  | "green_ratio"
  | "perfect_weeks"
  | "habit_pair";

export interface Insight {
  id: string;
  type: InsightType;
  emoji: string;
  title: string;
  body: string;
  /** 0–100, higher = more noteworthy */
  score: number;
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateToDow(dateKey: string): number {
  return new Date(dateKey + "T12:00:00").getDay();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateKey(d);
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ────────────────────────────────────────────────────────────
// Core computation
// ────────────────────────────────────────────────────────────

async function computeInsights(): Promise<Insight[]> {
  const today = toDateKey(new Date());
  const from = daysAgo(59); // 60 days of history

  const [items, rangeData, sleepData] = await Promise.all([
    listRoutineItems(),
    loadRangeStates({ from, to: today }),
    fetchSleepData(from, today),
  ]);

  const coreItems = items.filter(i => i.is_non_negotiable && i.is_active);
  const allActive = items.filter(i => i.is_active);
  const coreIds = new Set(coreItems.map(i => i.id));

  if (coreItems.length === 0) return [];

  const { logs, checks } = rangeData;
  const logMap = new Map(logs.map(l => [l.date, l]));

  // Build per-day stats
  type DayStat = { dateKey: string; coreDone: number; coreTotal: number; isGreen: boolean; dow: number; sleepHrs: number | null; checkedIds: Set<string> };
  const days: DayStat[] = [];
  const activeDates = new Set<string>();

  // Gather all dates that have at least one check
  for (const c of checks) activeDates.add(c.date);

  for (const dateKey of activeDates) {
    if (dateKey > today) continue;
    const dayChecks = checks.filter(c => c.date === dateKey);
    const checkedIds = new Set(dayChecks.filter(c => c.done).map(c => c.routine_item_id));
    const coreDone = coreItems.filter(i => checkedIds.has(i.id)).length;
    const isGreen = coreDone === coreItems.length;
    const sleepHrs = sleepData.get(dateKey) ?? null;

    days.push({
      dateKey,
      coreDone,
      coreTotal: coreItems.length,
      isGreen,
      dow: dateToDow(dateKey),
      sleepHrs,
      checkedIds,
    });
  }

  if (days.length < 7) return []; // Need at least a week of data

  const insights: Insight[] = [];

  // ── 1. Day-of-week pattern ──
  const dowGreen: number[] = Array(7).fill(0);
  const dowTotal: number[] = Array(7).fill(0);
  for (const d of days) {
    dowTotal[d.dow]++;
    if (d.isGreen) dowGreen[d.dow]++;
  }

  let bestDow = 0, worstDow = 0;
  let bestDowPct = -1, worstDowPct = 101;
  for (let i = 0; i < 7; i++) {
    if (dowTotal[i] < 2) continue;
    const p = pct(dowGreen[i], dowTotal[i]);
    if (p > bestDowPct) { bestDowPct = p; bestDow = i; }
    if (p < worstDowPct) { worstDowPct = p; worstDow = i; }
  }

  if (bestDowPct > worstDowPct && bestDowPct - worstDowPct >= 20) {
    insights.push({
      id: "dow-best",
      type: "day_of_week",
      emoji: "📅",
      title: `${DAY_NAMES[bestDow]}s are your best day`,
      body: `You hit a green day ${bestDowPct}% of ${DAY_NAMES[bestDow]}s vs ${worstDowPct}% on ${DAY_NAMES[worstDow]}s. Consider front-loading harder habits on ${DAY_SHORT[worstDow]}.`,
      score: bestDowPct - worstDowPct,
    });
  }

  // ── 2. Sleep correlation ──
  const withSleep = days.filter(d => d.sleepHrs !== null && d.sleepHrs > 0);
  if (withSleep.length >= 10) {
    const goodSleep = withSleep.filter(d => d.sleepHrs! >= 7);
    const badSleep = withSleep.filter(d => d.sleepHrs! < 7);

    if (goodSleep.length >= 3 && badSleep.length >= 3) {
      const goodGreenPct = pct(goodSleep.filter(d => d.isGreen).length, goodSleep.length);
      const badGreenPct = pct(badSleep.filter(d => d.isGreen).length, badSleep.length);
      const diff = goodGreenPct - badGreenPct;

      if (diff >= 15) {
        insights.push({
          id: "sleep-corr",
          type: "sleep_correlation",
          emoji: "😴",
          title: "Sleep drives your consistency",
          body: `On 7+ hour sleep nights, you complete all core habits ${goodGreenPct}% of the time vs ${badGreenPct}% on less sleep. That's a ${diff} point difference.`,
          score: diff,
        });
      }
    }
  }

  // ── 3. Best & worst habits ──
  const habitDone: Map<string, number> = new Map();
  const habitTotal: Map<string, number> = new Map();
  for (const d of days) {
    for (const item of allActive) {
      habitTotal.set(item.id, (habitTotal.get(item.id) ?? 0) + 1);
      if (d.checkedIds.has(item.id)) {
        habitDone.set(item.id, (habitDone.get(item.id) ?? 0) + 1);
      }
    }
  }

  const habitRates = allActive
    .map(item => ({
      item,
      rate: pct(habitDone.get(item.id) ?? 0, habitTotal.get(item.id) ?? 1),
      done: habitDone.get(item.id) ?? 0,
      total: habitTotal.get(item.id) ?? 0,
    }))
    .filter(h => h.total >= 7)
    .sort((a, b) => b.rate - a.rate);

  if (habitRates.length >= 2) {
    const best = habitRates[0];
    insights.push({
      id: "best-habit",
      type: "best_habit",
      emoji: best.item.emoji ?? "🏆",
      title: `${best.item.label} is your strongest habit`,
      body: `${best.rate}% completion rate over ${best.total} days. This one's on autopilot.`,
      score: best.rate,
    });

    const worst = habitRates[habitRates.length - 1];
    if (worst.rate < 70 && best.rate - worst.rate >= 20) {
      insights.push({
        id: "worst-habit",
        type: "worst_habit",
        emoji: worst.item.emoji ?? "🎯",
        title: `${worst.item.label} needs attention`,
        body: `Only ${worst.rate}% completion vs your average. Try pairing it with ${best.item.label} as a trigger.`,
        score: 100 - worst.rate,
      });
    }
  }

  // ── 4. Trend (last 2 weeks vs prior 2 weeks) ──
  const sorted = [...days].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  if (sorted.length >= 14) {
    const mid = sorted.length - 14;
    const recent = sorted.slice(mid);
    const prior = sorted.slice(Math.max(0, mid - 14), mid);

    if (prior.length >= 7) {
      const recentPct = pct(recent.filter(d => d.isGreen).length, recent.length);
      const priorPct = pct(prior.filter(d => d.isGreen).length, prior.length);
      const diff = recentPct - priorPct;

      if (Math.abs(diff) >= 10) {
        const improving = diff > 0;
        insights.push({
          id: "trend",
          type: "trend",
          emoji: improving ? "📈" : "📉",
          title: improving ? "You're trending up" : "Slight dip recently",
          body: improving
            ? `${recentPct}% green days in the last 2 weeks, up from ${priorPct}%. Whatever you changed is working.`
            : `${recentPct}% green days lately vs ${priorPct}% before. Small dips are normal — focus on getting back to green tomorrow.`,
          score: Math.abs(diff),
        });
      }
    }
  }

  // ── 5. Consistency score ──
  const totalDays = days.length;
  const greenDays = days.filter(d => d.isGreen).length;
  const overallPct = pct(greenDays, totalDays);

  insights.push({
    id: "consistency",
    type: "consistency",
    emoji: overallPct >= 80 ? "🔥" : overallPct >= 60 ? "💪" : "🌱",
    title: `${overallPct}% consistency score`,
    body: `${greenDays} green days out of ${totalDays} tracked. ${
      overallPct >= 80 ? "Elite-level consistency." :
      overallPct >= 60 ? "Solid foundation — keep building." :
      "Every green day is a win. Focus on small improvements."
    }`,
    score: overallPct,
  });

  // ── 6. Weekend vs weekday ──
  const weekdayDays = days.filter(d => d.dow >= 1 && d.dow <= 5);
  const weekendDays = days.filter(d => d.dow === 0 || d.dow === 6);
  if (weekdayDays.length >= 5 && weekendDays.length >= 3) {
    const wdPct = pct(weekdayDays.filter(d => d.isGreen).length, weekdayDays.length);
    const wePct = pct(weekendDays.filter(d => d.isGreen).length, weekendDays.length);
    const diff = Math.abs(wdPct - wePct);

    if (diff >= 20) {
      const weekdayBetter = wdPct > wePct;
      insights.push({
        id: "weekday-vs-weekend",
        type: "time_of_week",
        emoji: weekdayBetter ? "🏢" : "🎉",
        title: weekdayBetter ? "Weekdays are stronger" : "You crush weekends",
        body: weekdayBetter
          ? `${wdPct}% green on weekdays vs ${wePct}% on weekends. Weekends might need a lighter routine.`
          : `${wePct}% green on weekends vs ${wdPct}% on weekdays. Consider simplifying your weekday routine.`,
        score: diff,
      });
    }
  }

  // ── 7. Perfect weeks ──
  // Group by ISO week
  const weekMap = new Map<string, DayStat[]>();
  for (const d of days) {
    const dt = new Date(d.dateKey + "T12:00:00");
    const weekStart = new Date(dt);
    weekStart.setDate(dt.getDate() - ((dt.getDay() + 6) % 7)); // Monday
    const wk = toDateKey(weekStart);
    const arr = weekMap.get(wk) ?? [];
    arr.push(d);
    weekMap.set(wk, arr);
  }
  const perfectWeeks = [...weekMap.values()].filter(
    wk => wk.length >= 5 && wk.every(d => d.isGreen)
  ).length;

  if (perfectWeeks > 0) {
    insights.push({
      id: "perfect-weeks",
      type: "perfect_weeks",
      emoji: "🏆",
      title: `${perfectWeeks} perfect week${perfectWeeks > 1 ? "s" : ""}`,
      body: `You've had ${perfectWeeks} week${perfectWeeks > 1 ? "s" : ""} where every tracked day was green. That's the kind of consistency that compounds.`,
      score: perfectWeeks * 15,
    });
  }

  // Sort by score descending, take top 5
  return insights
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

// ── Sleep data helper ──
async function fetchSleepData(from: string, to: string): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  try {
    const userId = await getUserId();
    const { data } = await supabase
      .from("activity_logs")
      .select("date,value")
      .eq("user_id", userId)
      .eq("activity_key", "sleep")
      .gte("date", from)
      .lte("date", to);

    for (const row of data ?? []) {
      const existing = map.get(row.date) ?? 0;
      map.set(row.date, existing + Number(row.value ?? 0));
    }
  } catch {
    // sleep data optional
  }
  return map;
}

// ────────────────────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────────────────────

export function useInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await computeInsights();
        if (!cancelled) setInsights(result);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Failed to compute insights");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { insights, loading, error };
}
