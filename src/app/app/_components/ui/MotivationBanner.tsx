"use client";

import { useMemo } from "react";
import { getMotivation, getStreakRiskMessage, type MotivationContext } from "@/lib/motivation";

/**
 * Context-aware motivational message below the header.
 * 
 * Psychology: Variable-ratio reinforcement. The message changes daily,
 * adapts to time of day, streak state, and progress — so it never
 * feels like a stale "motivational poster." It feels like a coach.
 */
export function MotivationBanner({ ctx }: { ctx: MotivationContext }) {
  const msg = useMemo(() => getMotivation(ctx), [ctx]);
  const streakRisk = useMemo(
    () => getStreakRiskMessage(ctx.currentStreak, ctx.allCoreDone, ctx.coreDone, ctx.coreTotal),
    [ctx.currentStreak, ctx.allCoreDone, ctx.coreDone, ctx.coreTotal]
  );

  // Streak risk takes priority — it's time-sensitive urgency
  if (streakRisk) {
    return (
      <div className="rounded-xl px-4 py-3 animate-fade-in"
        style={{
          background: "rgba(251,191,36,0.08)",
          border: "1px solid rgba(251,191,36,0.2)",
        }}>
        <p className="text-sm font-semibold" style={{ color: "var(--accent-yellow-text, #fbbf24)" }}>
          {streakRisk}
        </p>
      </div>
    );
  }

  // Skip if nothing meaningful to say (green day has its own celebration)
  if (msg.type === "celebrate" && ctx.allCoreDone) return null;

  const bgMap = {
    greeting: "transparent",
    nudge: "rgba(251,191,36,0.06)",
    celebrate: "var(--accent-green-soft)",
    comeback: "rgba(99,102,241,0.08)",
    milestone_tease: "transparent",
  };

  const colorMap = {
    greeting: "var(--text-muted)",
    nudge: "var(--accent-yellow-text, #fbbf24)",
    celebrate: "var(--accent-green-text)",
    comeback: "var(--accent-blue-text, #818cf8)",
    milestone_tease: "var(--text-muted)",
  };

  return (
    <div className="rounded-xl px-3.5 py-2.5 animate-fade-in"
      style={{
        background: bgMap[msg.type],
        border: msg.type !== "greeting" && msg.type !== "milestone_tease" ? "1px solid rgba(255,255,255,0.06)" : "none",
      }}>
      <p className="text-sm leading-snug" style={{ color: colorMap[msg.type] }}>
        {msg.text}
      </p>
    </div>
  );
}
