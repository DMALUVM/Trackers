"use client";

import { useCallback, useEffect, useState } from "react";
import { addActivityLog, deleteActivityLogsForDate, sumActivity } from "@/lib/activity";
import { hapticLight, hapticMedium } from "@/lib/haptics";

const LS_HIDDEN_KEY = "routines365:waterTracker:hidden";
const LS_GOAL_KEY = "routines365:waterTracker:goal";
const DEFAULT_GOAL = 8;

interface WaterTrackerProps {
  dateKey: string;
}

export function WaterTracker({ dateKey }: WaterTrackerProps) {
  const [count, setCount] = useState(0);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [loading, setLoading] = useState(true);
  const [animatingIdx, setAnimatingIdx] = useState<number | null>(null);
  const [hidden, setHidden] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load settings
  useEffect(() => {
    try {
      setHidden(localStorage.getItem(LS_HIDDEN_KEY) === "1");
      const savedGoal = localStorage.getItem(LS_GOAL_KEY);
      if (savedGoal) setGoal(Math.max(1, Math.min(16, parseInt(savedGoal, 10) || DEFAULT_GOAL)));
    } catch {}
  }, []);

  // Load today's water count
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const total = await sumActivity({
          from: dateKey,
          to: dateKey,
          activityKey: "hydration",
          unit: "glasses",
        });
        if (!cancelled) setCount(Math.round(total));
      } catch {
        // stay at 0
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dateKey]);

  const syncCount = useCallback(async (newCount: number) => {
    try {
      await deleteActivityLogsForDate({ dateKey, activityKey: "hydration" });
      if (newCount > 0) {
        await addActivityLog({
          dateKey,
          activityKey: "hydration",
          value: newCount,
          unit: "glasses",
        });
      }
    } catch {}
  }, [dateKey]);

  const handleDotTap = useCallback((idx: number) => {
    const dotNumber = idx + 1;
    let next: number;

    if (idx < count) {
      next = idx;
    } else {
      next = dotNumber;
    }

    setCount(next);
    if (next > count) {
      setAnimatingIdx(idx);
      setTimeout(() => setAnimatingIdx(null), 350);
    }
    hapticLight();
    void syncCount(next);
  }, [count, syncCount]);

  const updateGoal = (newGoal: number) => {
    const clamped = Math.max(4, Math.min(12, newGoal));
    setGoal(clamped);
    localStorage.setItem(LS_GOAL_KEY, String(clamped));
    hapticLight();
  };

  const toggleHidden = () => {
    localStorage.setItem(LS_HIDDEN_KEY, "1");
    setHidden(true);
    hapticMedium();
  };

  if (loading || hidden) return null;

  const isFull = count >= goal;
  // Calculate dot size based on goal (more dots = smaller)
  const dotSize = goal <= 8 ? 22 : goal <= 10 ? 18 : 16;
  const dotGap = goal <= 8 ? "gap-1.5" : "gap-1";

  return (
    <div className="relative">
      <div
        className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-colors duration-300"
        style={{
          background: isFull ? "var(--accent-blue-soft)" : "var(--bg-card)",
          border: `1px solid ${isFull ? "var(--accent-blue)" : "var(--border-primary)"}`,
        }}
      >
        {/* Tap emoji to open settings */}
        <button type="button" onClick={() => { setShowSettings(s => !s); hapticLight(); }}
          className="text-xl leading-none tap-btn" aria-label="Water tracker settings">
          💧
        </button>

        <div className={`flex-1 flex items-center flex-wrap ${dotGap}`}>
          {Array.from({ length: goal }).map((_, i) => {
            const filled = i < count;
            const isAnimating = i === animatingIdx;
            return (
              <button
                key={i}
                type="button"
                className="transition-all duration-200"
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: "50%",
                  background: filled ? "var(--accent-blue)" : "var(--bg-card-hover)",
                  border: filled ? "2px solid var(--accent-blue)" : "2px solid var(--border-secondary)",
                  transform: isAnimating ? "scale(1.3)" : "scale(1)",
                  opacity: filled ? 1 : 0.5,
                }}
                onClick={() => handleDotTap(i)}
                aria-label={filled ? `Remove glass ${i + 1}` : `Add glass ${i + 1}`}
              />
            );
          })}
        </div>

        <span
          className="text-sm font-bold tabular-nums whitespace-nowrap"
          style={{ color: isFull ? "var(--accent-blue-text)" : "var(--text-primary)" }}
        >
          {count}/{goal}
        </span>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowSettings(false)} />
          {/* Modal */}
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-sm rounded-2xl p-5 animate-fade-in-up"
            style={{ background: "var(--bg-sheet)", boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">💧</span>
                <span className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Water Goal</span>
              </div>
              <button type="button" onClick={() => setShowSettings(false)}
                className="text-sm font-semibold px-3 py-1.5 rounded-lg"
                style={{ color: "var(--accent-green-text)", background: "var(--accent-green-soft)" }}>
                Done
              </button>
            </div>

            {/* Goal stepper */}
            <div className="flex items-center justify-center gap-6 mb-4">
              <button type="button" onClick={() => updateGoal(goal - 1)}
                disabled={goal <= 4}
                className="tap-btn flex items-center justify-center rounded-full text-xl font-bold"
                style={{
                  width: 44, height: 44,
                  background: "var(--bg-card-hover)",
                  color: goal <= 4 ? "var(--text-faint)" : "var(--text-primary)",
                }}>
                −
              </button>
              <div className="text-center">
                <span className="text-3xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{goal}</span>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>glasses/day</p>
              </div>
              <button type="button" onClick={() => updateGoal(goal + 1)}
                disabled={goal >= 12}
                className="tap-btn flex items-center justify-center rounded-full text-xl font-bold"
                style={{
                  width: 44, height: 44,
                  background: "var(--bg-card-hover)",
                  color: goal >= 12 ? "var(--text-faint)" : "var(--text-primary)",
                }}>
                +
              </button>
            </div>

            {/* Hide button */}
            <button type="button" onClick={toggleHidden}
              className="w-full text-center text-xs font-medium py-2.5 rounded-xl"
              style={{ color: "var(--text-faint)", background: "var(--bg-card-hover)" }}>
              Hide water tracker
            </button>
            <p className="text-[10px] text-center mt-1.5" style={{ color: "var(--text-faint)" }}>
              Re-enable in Settings → Customize Today
            </p>
          </div>
        </>
      )}
    </div>
  );
}
