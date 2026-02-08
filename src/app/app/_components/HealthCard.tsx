"use client";

import { Heart, Footprints, Moon, Flame, Dumbbell } from "lucide-react";
import { useHealthKit } from "@/lib/hooks/useHealthKit";
import { hapticLight } from "@/lib/haptics";

/**
 * Compact Apple Health summary card shown on Today page.
 * Only renders when running in native app with HealthKit authorized.
 * Shows: steps, sleep, calories, workouts.
 */
export function HealthCard() {
  const { available, authorized, requestAuth, steps, sleep, summary, loading } = useHealthKit();

  // Don't show anything on web
  if (!available) return null;

  // Show connect prompt if not authorized
  if (!authorized) {
    return (
      <button
        type="button"
        onClick={() => { hapticLight(); void requestAuth(); }}
        className="w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
        style={{
          background: "var(--bg-card)",
          border: "2px dashed var(--border-primary)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="shrink-0 flex items-center justify-center rounded-xl"
            style={{ width: 44, height: 44, background: "rgba(239,68,68,0.1)" }}>
            <Heart size={22} style={{ color: "#ef4444" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Connect Apple Health
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Auto-track steps, sleep, and workouts
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>
            Connect
          </span>
        </div>
      </button>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl p-4 animate-pulse"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
        <div className="h-16" />
      </div>
    );
  }

  const sleepHours = sleep ? (sleep.totalMinutes / 60).toFixed(1) : null;
  const workoutCount = summary?.workouts?.length ?? 0;
  const calories = summary?.activeCalories ?? 0;

  return (
    <div className="rounded-2xl p-4"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Heart size={14} style={{ color: "#ef4444" }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
          Apple Health
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Steps */}
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 flex items-center justify-center rounded-lg"
            style={{ width: 36, height: 36, background: "rgba(59,130,246,0.1)" }}>
            <Footprints size={18} style={{ color: "#3b82f6" }} />
          </div>
          <div>
            <p className="text-lg font-bold leading-none" style={{ color: "var(--text-primary)" }}>
              {steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : steps}
            </p>
            <p className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>steps</p>
          </div>
        </div>

        {/* Sleep */}
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 flex items-center justify-center rounded-lg"
            style={{ width: 36, height: 36, background: "rgba(139,92,246,0.1)" }}>
            <Moon size={18} style={{ color: "#8b5cf6" }} />
          </div>
          <div>
            <p className="text-lg font-bold leading-none" style={{ color: "var(--text-primary)" }}>
              {sleepHours ?? "—"}
            </p>
            <p className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>
              {sleepHours ? "hrs sleep" : "no data"}
            </p>
          </div>
        </div>

        {/* Calories */}
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 flex items-center justify-center rounded-lg"
            style={{ width: 36, height: 36, background: "rgba(249,115,22,0.1)" }}>
            <Flame size={18} style={{ color: "#f97316" }} />
          </div>
          <div>
            <p className="text-lg font-bold leading-none" style={{ color: "var(--text-primary)" }}>
              {calories > 0 ? calories : "—"}
            </p>
            <p className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>
              {calories > 0 ? "cal burned" : "no data"}
            </p>
          </div>
        </div>

        {/* Workouts */}
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 flex items-center justify-center rounded-lg"
            style={{ width: 36, height: 36, background: "rgba(16,185,129,0.1)" }}>
            <Dumbbell size={18} style={{ color: "#10b981" }} />
          </div>
          <div>
            <p className="text-lg font-bold leading-none" style={{ color: "var(--text-primary)" }}>
              {workoutCount > 0 ? workoutCount : "—"}
            </p>
            <p className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>
              {workoutCount === 1 ? "workout" : workoutCount > 1 ? "workouts" : "none today"}
            </p>
          </div>
        </div>
      </div>

      {/* Workout details */}
      {summary?.workouts && summary.workouts.length > 0 && (
        <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid var(--border-primary)" }}>
          {summary.workouts.map((w, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
                {w.type}
              </span>
              <span style={{ color: "var(--text-faint)" }}>
                {w.durationMinutes}min · {w.calories} cal
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
