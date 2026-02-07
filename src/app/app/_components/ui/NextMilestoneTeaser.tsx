"use client";

import { useMemo } from "react";
import { getNextMilestone } from "@/lib/milestones";

/**
 * Shows progress toward the next streak milestone in the score card.
 *
 * Psychology: "Endowed progress effect" — people are more motivated
 * to complete a goal if they feel they've already made progress.
 * A bar showing "5 of 7 days toward 🔥 One Week" is far more
 * compelling than just showing "5-day streak."
 * 
 * Also: "Goal gradient effect" — acceleration toward a finish line.
 * The closer you get, the harder you try.
 */
export function NextMilestoneTeaser({
  currentStreak,
  totalGreenDays,
}: {
  currentStreak: number;
  totalGreenDays: number;
}) {
  const next = useMemo(() => getNextMilestone(currentStreak, totalGreenDays), [currentStreak, totalGreenDays]);

  // Prioritize streak milestone (more salient day-to-day)
  const target = next.streakNext;
  if (!target) return null;

  const prevThreshold = (() => {
    // Find the milestone just before the target
    const streakMilestones = [0, 3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365];
    for (let i = streakMilestones.length - 1; i >= 0; i--) {
      if (streakMilestones[i] < target.threshold) return streakMilestones[i];
    }
    return 0;
  })();

  const range = target.threshold - prevThreshold;
  const progress = currentStreak - prevThreshold;
  const pct = Math.min(100, Math.max(0, (progress / range) * 100));
  const daysLeft = target.threshold - currentStreak;

  // Don't show if too far away (> 30 days) — it's demotivating
  if (daysLeft > 30) return null;

  return (
    <div className="mt-3 animate-fade-in">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>
          Next: {target.emoji} {target.title}
        </span>
        <span className="text-[11px] font-bold tabular-nums" style={{ color: "var(--text-muted)" }}>
          {daysLeft} day{daysLeft !== 1 ? "s" : ""} away
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="relative h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--bg-card-hover)" }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: pct >= 80
              ? "var(--accent-green)"
              : "linear-gradient(90deg, var(--accent-green-soft), var(--accent-green))",
            boxShadow: pct >= 80 ? "0 0 8px var(--accent-green)" : "none",
          }}
        />
      </div>
    </div>
  );
}
