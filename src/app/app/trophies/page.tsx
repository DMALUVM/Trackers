"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getAllEarnedMilestones,
  STREAK_MILESTONES,
  GREEN_TOTAL_MILESTONES,
  getAchievedMilestones,
} from "@/lib/milestones";
import type { Milestone } from "@/lib/milestones";
import { useStreaks } from "@/lib/hooks";
import { useToday } from "@/lib/hooks";
import { hapticLight } from "@/lib/haptics";

/**
 * Trophy case — see all milestones earned and upcoming.
 *
 * Psychology: "Endowment effect" — once you own something,
 * you value it more. Showing all earned trophies makes the user
 * feel invested. The locked ones create aspiration.
 *
 * Also: "Collection motivation" — humans love completing sets.
 * Seeing 8/11 streak milestones earned creates a need to collect them all.
 */
export default function TrophiesPage() {
  const router = useRouter();
  const { dateKey } = useToday();
  const streaks = useStreaks(dateKey);
  const [achieved, setAchieved] = useState<Set<string>>(new Set());

  useEffect(() => {
    setAchieved(getAchievedMilestones());
  }, []);

  const earned = getAllEarnedMilestones();

  const renderMilestone = (m: Milestone, isEarned: boolean) => (
    <div key={m.id}
      className="flex items-center gap-4 rounded-2xl p-4 transition-all"
      style={{
        background: isEarned ? "var(--bg-card)" : "transparent",
        border: `1px solid ${isEarned ? "var(--border-primary)" : "var(--border-primary)"}`,
        opacity: isEarned ? 1 : 0.4,
      }}>
      <div className="shrink-0 flex items-center justify-center rounded-xl"
        style={{
          width: 48, height: 48,
          background: isEarned ? "var(--accent-green-soft)" : "var(--bg-card-hover)",
          fontSize: isEarned ? 24 : 18,
        }}>
        {isEarned ? m.emoji : <Lock size={18} style={{ color: "var(--text-faint)" }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: isEarned ? "var(--text-primary)" : "var(--text-faint)" }}>
          {m.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: isEarned ? "var(--text-muted)" : "var(--text-faint)" }}>
          {isEarned ? m.message : `${m.type === "streak" ? `${m.threshold}-day streak` : `${m.threshold} green days total`}`}
        </p>
      </div>
      {isEarned && (
        <span className="text-xs font-bold" style={{ color: "var(--accent-green-text)" }}>✓</span>
      )}
    </div>
  );

  const streakEarned = STREAK_MILESTONES.filter((m) => achieved.has(m.id)).length;
  const greenEarned = GREEN_TOTAL_MILESTONES.filter((m) => achieved.has(m.id)).length;

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <header className="flex items-center gap-3 pt-1">
        <button type="button" onClick={() => { hapticLight(); router.back(); }}
          className="flex items-center justify-center rounded-full"
          style={{ width: 36, height: 36, background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <ChevronLeft size={18} style={{ color: "var(--text-muted)" }} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Trophies</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {earned.length} earned
          </p>
        </div>
      </header>

      {/* Summary stats */}
      <section className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-black tabular-nums" style={{ color: "var(--text-primary)" }}>
            {streaks.loading ? "–" : streaks.currentStreak}
          </p>
          <p className="text-xs mt-1 font-semibold" style={{ color: "var(--text-muted)" }}>Current streak</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-black tabular-nums" style={{ color: "var(--text-primary)" }}>
            {streaks.loading ? "–" : streaks.bestStreak}
          </p>
          <p className="text-xs mt-1 font-semibold" style={{ color: "var(--text-muted)" }}>Best streak</p>
        </div>
      </section>

      {/* Streak milestones */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
            🔥 Streak milestones
          </p>
          <p className="text-xs font-bold tabular-nums" style={{ color: "var(--text-faint)" }}>
            {streakEarned}/{STREAK_MILESTONES.length}
          </p>
        </div>
        <div className="space-y-2">
          {STREAK_MILESTONES.map((m) => renderMilestone(m, achieved.has(m.id)))}
        </div>
      </section>

      {/* Green day milestones */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
            🟢 Green day milestones
          </p>
          <p className="text-xs font-bold tabular-nums" style={{ color: "var(--text-faint)" }}>
            {greenEarned}/{GREEN_TOTAL_MILESTONES.length}
          </p>
        </div>
        <div className="space-y-2">
          {GREEN_TOTAL_MILESTONES.map((m) => renderMilestone(m, achieved.has(m.id)))}
        </div>
      </section>
    </div>
  );
}
