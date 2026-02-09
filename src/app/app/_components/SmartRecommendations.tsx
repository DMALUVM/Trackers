"use client";

import { useMemo } from "react";
import { Lightbulb } from "lucide-react";
import type { StreakData } from "@/lib/hooks/useStreaks";

export interface SmartRecommendation {
  id: string;
  emoji: string;
  text: string;
  type: "warning" | "tip" | "praise";
  priority: number;
}

/**
 * Generate smart recommendations based on user's habit data.
 * These are contextual, actionable suggestions — not just stats.
 */
export function generateRecommendations(streaks: StreakData | null): SmartRecommendation[] {
  if (!streaks) return [];

  const recs: SmartRecommendation[] = [];
  const last7 = streaks.last7Days ?? [];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // 1. Weak day detection — which days do they miss most?
  if (last7.length >= 7) {
    const today = new Date();
    const dayStats: Record<number, { green: number; total: number }> = {};

    // Use last7 to infer patterns (would be better with 30 days but this works)
    last7.forEach((d, i) => {
      const dayOfWeek = new Date(today.getTime() - (6 - i) * 86400000).getDay();
      if (!dayStats[dayOfWeek]) dayStats[dayOfWeek] = { green: 0, total: 0 };
      dayStats[dayOfWeek].total++;
      if (d.color === "green") dayStats[dayOfWeek].green++;
    });

    // Find weakest day
    const weakDays = Object.entries(dayStats)
      .filter(([_, v]) => v.total > 0 && v.green === 0)
      .map(([day]) => dayNames[Number(day)]);

    if (weakDays.length > 0 && weakDays.length <= 2) {
      recs.push({
        id: "weak-day",
        emoji: "📅",
        text: `${weakDays.join(" and ")} ${weakDays.length === 1 ? "is" : "are"} your toughest. Consider reducing habits on ${weakDays.length === 1 ? "that day" : "those days"} or setting a reminder.`,
        type: "tip",
        priority: 8,
      });
    }
  }

  // 2. Streak at risk
  if (streaks.activeStreak >= 3 && streaks.currentStreak === 0) {
    recs.push({
      id: "streak-risk",
      emoji: "🔥",
      text: `You have a ${streaks.activeStreak}-day streak going! Complete your habits today to keep it alive.`,
      type: "warning",
      priority: 10,
    });
  }

  // 3. Consistency praise
  if (streaks.activeStreak >= 7) {
    recs.push({
      id: "streak-praise",
      emoji: "💪",
      text: `${streaks.activeStreak} days strong! You're building real momentum. This is when habits start becoming automatic.`,
      type: "praise",
      priority: 5,
    });
  }

  // 4. Recovery after a break
  const recentColors = last7.map((d) => d.color);
  const lastThree = recentColors.slice(-3);
  if (lastThree.filter((c) => c === "red").length >= 2 && lastThree[lastThree.length - 1] === "green") {
    recs.push({
      id: "bounce-back",
      emoji: "🔄",
      text: "Great bounce-back! Missing days is normal. What matters is showing up again.",
      type: "praise",
      priority: 6,
    });
  }

  // 5. Suggest rest day if overloaded
  if (streaks.activeStreak >= 14) {
    recs.push({
      id: "rest-day",
      emoji: "🧘",
      text: "Two weeks of consistency! Consider scheduling a rest day to prevent burnout.",
      type: "tip",
      priority: 4,
    });
  }

  // 6. Green day momentum
  const greenCount = recentColors.filter((c) => c === "green").length;
  if (greenCount >= 5) {
    const pct = Math.round((greenCount / 7) * 100);
    recs.push({
      id: "weekly-rate",
      emoji: "📊",
      text: `${pct}% success rate this week. You're performing above average.`,
      type: "praise",
      priority: 3,
    });
  }

  // Sort by priority (highest first) and take top 2
  return recs.sort((a, b) => b.priority - a.priority).slice(0, 2);
}

/**
 * SmartRecommendations card component for the Today page.
 */
export function SmartRecommendations({ streaks }: { streaks: StreakData | null }) {
  const recs = useMemo(() => generateRecommendations(streaks), [streaks]);

  if (recs.length === 0) return null;

  return (
    <div className="rounded-2xl p-4 space-y-2.5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb size={14} style={{ color: "#f59e0b" }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
          Smart Tips
        </span>
      </div>
      {recs.map((rec) => (
        <div key={rec.id} className="flex items-start gap-2.5">
          <span className="text-sm shrink-0 mt-0.5">{rec.emoji}</span>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {rec.text}
          </p>
        </div>
      ))}
    </div>
  );
}
