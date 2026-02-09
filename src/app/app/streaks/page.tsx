"use client";

import { useState, useCallback } from "react";
import { Pin, PinOff, Share2, Trophy, ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import { useToday, useHabitStreaks, getPinnedHabits, togglePinHabit } from "@/lib/hooks";
import type { HabitStreak } from "@/lib/hooks";
import { SubPageHeader } from "@/app/app/_components/ui";
import { hapticLight, hapticMedium, hapticHeavy } from "@/lib/haptics";

const MILESTONE_THRESHOLDS = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365];
const MILESTONE_EMOJI: Record<number, string> = {
  3: "🔥", 7: "⚡", 14: "💪", 21: "🧠", 30: "🏆",
  50: "⭐", 75: "💎", 100: "👑", 150: "🌟", 200: "🔱", 365: "🎆",
};

// ── Share Card Generator ──

function generateHabitShareCard(habit: HabitStreak): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const W = 600, H = 440, dpr = 2;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) { resolve(null); return; }
    ctx.scale(dpr, dpr);

    // Background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0a0f1a");
    grad.addColorStop(1, "#111827");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Border
    ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(4, 4, W - 8, H - 8, 16);
    ctx.stroke();

    // App name
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 13px -apple-system, system-ui, sans-serif";
    ctx.fillText("ROUTINES365", 32, 38);

    // Habit name + emoji
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px -apple-system, system-ui, sans-serif";
    ctx.fillText(`${habit.emoji ?? "•"} ${habit.label}`, 32, 76);

    // Hero streak
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 96px -apple-system, system-ui, sans-serif";
    ctx.fillText(`${habit.currentStreak}`, 32, 190);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "600 18px -apple-system, system-ui, sans-serif";
    ctx.fillText(habit.currentStreak === 1 ? "day streak" : "day streak", 32, 218);

    // Stats row
    const stats = [
      { val: `${habit.bestStreak}`, label: "best streak" },
      { val: `${habit.completionPct}%`, label: "completion" },
      { val: `${habit.allTime}`, label: "total days" },
    ];
    stats.forEach((s, i) => {
      const x = 32 + i * 185;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px -apple-system, system-ui, sans-serif";
      ctx.fillText(s.val, x, 280);
      ctx.fillStyle = "#6b7280";
      ctx.font = "500 12px -apple-system, system-ui, sans-serif";
      ctx.fillText(s.label, x, 300);
    });

    // Last 30 days mini heatmap
    ctx.fillStyle = "#6b7280";
    ctx.font = "600 11px -apple-system, system-ui, sans-serif";
    ctx.fillText("LAST 30 DAYS", 32, 340);

    habit.last30.forEach((done, i) => {
      const col = i % 15;
      const row = Math.floor(i / 15);
      const x = 32 + col * 36;
      const y = 354 + row * 22;
      ctx.fillStyle = done ? "#10b981" : "#1f2937";
      ctx.beginPath();
      ctx.roundRect(x, y, 30, 16, 4);
      ctx.fill();
    });

    // Footer
    ctx.fillStyle = "#374151";
    ctx.font = "400 11px -apple-system, system-ui, sans-serif";
    ctx.fillText("Track your habits · routines365.com", 32, H - 16);

    canvas.toBlob(blob => resolve(blob), "image/png");
  });
}

async function shareHabit(habit: HabitStreak) {
  hapticMedium();
  try {
    const blob = await generateHabitShareCard(habit);
    if (!blob) return;
    const file = new File([blob], `routines365-${habit.label.toLowerCase().replace(/\s+/g, "-")}.png`, { type: "image/png" });

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `My ${habit.label} Streak`,
          text: `${habit.currentStreak} day streak on ${habit.label}! ${habit.emoji ?? "💪"}`,
          files: [file],
        });
        return;
      } catch { /* fallback */ }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  } catch { /* silent */ }
}

// ── Hero Streak Card (pinned habits) ──

function HeroCard({ habit, onUnpin }: { habit: HabitStreak; onUnpin: () => void }) {
  const pct = habit.nextMilestoneAt
    ? Math.min((habit.currentStreak / habit.nextMilestoneAt) * 100, 100)
    : 100;

  return (
    <div className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>

      {/* Unpin button */}
      <button type="button" onClick={() => { hapticLight(); onUnpin(); }}
        className="absolute top-3 right-3 tap-btn p-1.5 rounded-full"
        style={{ background: "var(--bg-card-hover)" }}>
        <PinOff size={14} style={{ color: "var(--text-faint)" }} />
      </button>

      {/* Emoji + label */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{habit.emoji ?? "•"}</span>
        <p className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>{habit.label}</p>
        {habit.isCore && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: "var(--accent-green-soft)", color: "var(--accent-green-text)" }}>CORE</span>
        )}
      </div>

      {/* Hero number */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-5xl font-black tabular-nums" style={{ color: "var(--text-primary)" }}>
          {habit.currentStreak}
        </span>
        <span className="text-lg font-bold" style={{ color: "var(--text-faint)" }}>
          {habit.currentStreak === 1 ? "day" : "days"}
        </span>
      </div>

      {/* Best streak */}
      <p className="text-xs mb-4" style={{ color: "var(--text-faint)" }}>
        Best: {habit.bestStreak} days · {habit.completionPct}% completion
      </p>

      {/* Progress to next milestone */}
      {habit.nextMilestoneAt && (
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>
              Next: {MILESTONE_EMOJI[habit.nextMilestoneAt] ?? "🏅"} {habit.nextMilestoneAt} days
            </span>
            <span className="text-[10px] font-bold tabular-nums" style={{ color: "var(--accent-green-text)" }}>
              {Math.round(pct)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-card-hover)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: "var(--accent-green)" }} />
          </div>
        </div>
      )}

      {/* WTD / MTD / YTD / ALL */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {(["WTD", "MTD", "YTD", "ALL"] as const).map((period, i) => (
          <div key={period} className="text-center py-2 rounded-xl" style={{ background: "var(--bg-card-hover)" }}>
            <p className="text-[9px] font-bold tracking-wider" style={{ color: "var(--text-faint)" }}>{period}</p>
            <p className="text-base font-bold tabular-nums mt-0.5" style={{ color: "var(--text-primary)" }}>
              {[habit.wtd, habit.mtd, habit.ytd, habit.allTime][i]}
            </p>
          </div>
        ))}
      </div>

      {/* Milestones earned */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {MILESTONE_THRESHOLDS.map((t) => {
          const earned = habit.currentStreak >= t || habit.bestStreak >= t;
          return (
            <span key={t} className="text-center rounded-lg px-1.5 py-1" style={{
              background: earned ? "var(--accent-green-soft)" : "var(--bg-card-hover)",
              opacity: earned ? 1 : 0.4,
              fontSize: "11px",
            }}>
              {MILESTONE_EMOJI[t] ?? "🏅"} {t}d
            </span>
          );
        })}
      </div>

      {/* Share */}
      <button type="button" onClick={() => void shareHabit(habit)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all active:scale-[0.97]"
        style={{ background: "var(--bg-card-hover)" }}>
        <Share2 size={14} style={{ color: "var(--text-muted)" }} />
        <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Share Streak</span>
      </button>
    </div>
  );
}

// ── Compact Habit Row ──

function HabitRow({ habit, isPinned, onTogglePin }: {
  habit: HabitStreak; isPinned: boolean; onTogglePin: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
      {/* Main row */}
      <button type="button" className="w-full px-4 py-3.5 flex items-center gap-3 text-left"
        onClick={() => { setExpanded(e => !e); hapticLight(); }}>
        <span className="text-xl">{habit.emoji ?? "•"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{habit.label}</p>
            {habit.isCore && (
              <span className="text-[8px] font-bold px-1 py-0.5 rounded shrink-0"
                style={{ background: "var(--accent-green-soft)", color: "var(--accent-green-text)" }}>CORE</span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
            {habit.completionPct}% · Best: {habit.bestStreak}d
          </p>
        </div>

        {/* Streak badge */}
        <div className="text-right shrink-0">
          <span className="text-xl font-black tabular-nums" style={{
            color: habit.currentStreak >= 7 ? "var(--accent-green-text)" :
              habit.currentStreak >= 3 ? "var(--accent-yellow-text)" : "var(--text-primary)",
          }}>
            {habit.currentStreak}
          </span>
          <p className="text-[9px] font-bold" style={{ color: "var(--text-faint)" }}>
            {habit.currentStreak === 1 ? "day" : "days"}
          </p>
        </div>

        <ChevronRight size={16} style={{
          color: "var(--text-faint)",
          transform: expanded ? "rotate(90deg)" : "none",
          transition: "transform 0.2s",
        }} />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid var(--border-primary)" }}>
          {/* WTD/MTD/YTD/ALL */}
          <div className="grid grid-cols-4 gap-2 pt-3">
            {(["WTD", "MTD", "YTD", "ALL"] as const).map((period, i) => (
              <div key={period} className="text-center py-1.5 rounded-lg" style={{ background: "var(--bg-card-hover)" }}>
                <p className="text-[9px] font-bold tracking-wider" style={{ color: "var(--text-faint)" }}>{period}</p>
                <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {[habit.wtd, habit.mtd, habit.ytd, habit.allTime][i]}
                </p>
              </div>
            ))}
          </div>

          {/* 30-day heatmap */}
          <div>
            <p className="text-[9px] font-bold tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>LAST 30 DAYS</p>
            <div className="flex gap-[3px]">
              {habit.last30.map((done, i) => (
                <div key={i} className="flex-1 h-3 rounded-sm"
                  style={{ background: done ? "var(--accent-green)" : "var(--bg-card-hover)" }} />
              ))}
            </div>
          </div>

          {/* Mini milestones */}
          <div className="flex gap-1 flex-wrap">
            {MILESTONE_THRESHOLDS.slice(0, 7).map((t) => {
              const earned = habit.currentStreak >= t || habit.bestStreak >= t;
              return (
                <span key={t} className="rounded px-1.5 py-0.5" style={{
                  fontSize: "10px", fontWeight: 700,
                  background: earned ? "var(--accent-green-soft)" : "var(--bg-card-hover)",
                  color: earned ? "var(--accent-green-text)" : "var(--text-faint)",
                  opacity: earned ? 1 : 0.5,
                }}>
                  {MILESTONE_EMOJI[t]} {t}d
                </span>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button type="button" onClick={(e) => { e.stopPropagation(); hapticMedium(); onTogglePin(); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
              style={{ background: isPinned ? "var(--accent-green-soft)" : "var(--bg-card-hover)" }}>
              {isPinned ? <PinOff size={13} /> : <Pin size={13} />}
              <span className="text-xs font-bold" style={{ color: isPinned ? "var(--accent-green-text)" : "var(--text-muted)" }}>
                {isPinned ? "Unpin" : "Pin to top"}
              </span>
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); void shareHabit(habit); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
              style={{ background: "var(--bg-card-hover)" }}>
              <Share2 size={13} style={{ color: "var(--text-muted)" }} />
              <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Share</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──

export default function StreaksPage() {
  const { dateKey } = useToday();
  const { habits, loading } = useHabitStreaks(dateKey);
  const [pinned, setPinned] = useState<Set<string>>(() => getPinnedHabits());
  const [, forceUpdate] = useState(0);

  const handleTogglePin = useCallback((id: string) => {
    const ok = togglePinHabit(id);
    if (!ok) {
      hapticHeavy();
      return; // max 5 pinned
    }
    hapticMedium();
    setPinned(getPinnedHabits());
    forceUpdate(n => n + 1);
  }, []);

  const pinnedHabits = habits.filter(h => pinned.has(h.id));
  const unpinnedHabits = habits.filter(h => !pinned.has(h.id));

  return (
    <div className="space-y-5">
      <SubPageHeader
        title="My Streaks"
        subtitle={loading ? "Loading..." : `${habits.length} habits tracked`}
        rightAction={
          <Link href="/app/partner" className="tap-btn rounded-full flex items-center gap-1.5 px-3 py-2"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", textDecoration: "none" }}>
            <Users size={16} style={{ color: "var(--accent-green)" }} />
            <span className="text-xs font-bold" style={{ color: "var(--accent-green)" }}>Partner</span>
          </Link>
        }
      />

      {loading && (
        <div className="py-12 text-center">
          <div className="animate-spin w-6 h-6 border-2 rounded-full mx-auto"
            style={{ borderColor: "var(--text-faint)", borderTopColor: "var(--accent-green)" }} />
        </div>
      )}

      {!loading && habits.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>No habits yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>
            Add routines and start building streaks
          </p>
        </div>
      )}

      {/* Pinned hero cards */}
      {pinnedHabits.length > 0 && (
        <div className="space-y-3">
          {pinnedHabits.map((h) => (
            <HeroCard key={h.id} habit={h} onUnpin={() => handleTogglePin(h.id)} />
          ))}
        </div>
      )}

      {/* Pin prompt */}
      {!loading && pinnedHabits.length === 0 && habits.length > 0 && (
        <div className="rounded-2xl p-4 text-center"
          style={{ background: "var(--bg-card)", border: "1px dashed var(--border-secondary)" }}>
          <p className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>
            📌 Pin your most important habits
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
            Tap any habit below and pin it for a big streak counter
          </p>
        </div>
      )}

      {/* All habits list */}
      {unpinnedHabits.length > 0 && (
        <div className="space-y-2">
          {pinnedHabits.length > 0 && (
            <p className="text-xs font-bold tracking-wider uppercase px-1" style={{ color: "var(--text-faint)" }}>
              All habits
            </p>
          )}
          {unpinnedHabits.map((h) => (
            <HabitRow key={h.id} habit={h} isPinned={false}
              onTogglePin={() => handleTogglePin(h.id)} />
          ))}
        </div>
      )}

      {/* Trophies link */}
      {!loading && (
        <Link href="/app/trophies"
          className="flex items-center gap-3 rounded-2xl p-4 transition-all active:scale-[0.98]"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", textDecoration: "none" }}>
          <Trophy size={20} style={{ color: "#f59e0b" }} />
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Trophy Case</p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>View all your milestones and achievements</p>
          </div>
          <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
        </Link>
      )}
    </div>
  );
}
