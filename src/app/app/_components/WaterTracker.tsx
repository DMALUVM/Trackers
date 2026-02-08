"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addActivityLog, sumActivity, listActivityLogs, deleteActivityLog } from "@/lib/activity";
import { hapticLight } from "@/lib/haptics";

const GOAL = 8;

interface WaterTrackerProps {
  dateKey: string;
}

export function WaterTracker({ dateKey }: WaterTrackerProps) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [animatingIdx, setAnimatingIdx] = useState<number | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

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

  // Add a glass
  const increment = useCallback(async () => {
    const next = count + 1;
    setCount(next);
    setAnimatingIdx(next - 1);
    setTimeout(() => setAnimatingIdx(null), 400);
    hapticLight();
    try {
      await addActivityLog({
        dateKey,
        activityKey: "hydration",
        value: 1,
        unit: "glasses",
      });
    } catch {
      // queued offline
    }
  }, [count, dateKey]);

  // Remove last glass (long-press)
  const decrement = useCallback(async () => {
    if (count <= 0) return;
    const next = count - 1;
    setCount(next);
    hapticLight();
    try {
      const logs = await listActivityLogs({
        from: dateKey,
        to: dateKey,
        activityKey: "hydration",
      });
      // Find most recent glasses entry
      const glassLog = logs.find((l) => l.unit === "glasses");
      if (glassLog) {
        await deleteActivityLog(glassLog.id);
      }
    } catch {
      // best effort
    }
  }, [count, dateKey]);

  const handlePointerDown = useCallback(
    (idx: number) => {
      didLongPress.current = false;
      // Only long-press on filled dots
      if (idx < count) {
        longPressTimer.current = setTimeout(() => {
          didLongPress.current = true;
          void decrement();
        }, 500);
      }
    },
    [count, decrement]
  );

  const handlePointerUp = useCallback(
    (idx: number) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      // Normal tap on the next empty dot = increment
      if (!didLongPress.current && idx === count && count < GOAL) {
        void increment();
      }
    },
    [count, increment]
  );

  const handlePointerCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Tap anywhere on the row to add (if not at goal)
  const handleRowTap = useCallback(() => {
    if (count < GOAL) {
      void increment();
    }
  }, [count, increment]);

  if (loading) return null;

  const isFull = count >= GOAL;

  return (
    <button
      type="button"
      onClick={handleRowTap}
      className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-transform active:scale-[0.98]"
      style={{
        background: isFull ? "var(--accent-blue-soft, rgba(59,130,246,0.1))" : "var(--bg-card)",
        border: `1px solid ${isFull ? "var(--accent-blue, #3b82f6)" : "var(--border-primary)"}`,
      }}
    >
      <span className="text-xl leading-none">💧</span>

      <div className="flex-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        {Array.from({ length: GOAL }).map((_, i) => {
          const filled = i < count;
          const isAnimating = i === animatingIdx;
          return (
            <button
              key={i}
              type="button"
              className="transition-all duration-200"
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: filled
                  ? "var(--accent-blue, #3b82f6)"
                  : "var(--bg-card-hover)",
                border: filled
                  ? "2px solid var(--accent-blue, #3b82f6)"
                  : "2px solid var(--border-secondary, var(--border-primary))",
                transform: isAnimating ? "scale(1.3)" : "scale(1)",
                opacity: filled ? 1 : 0.5,
              }}
              onPointerDown={() => handlePointerDown(i)}
              onPointerUp={() => handlePointerUp(i)}
              onPointerCancel={handlePointerCancel}
              onPointerLeave={handlePointerCancel}
              aria-label={filled ? `Glass ${i + 1} filled — long press to remove` : `Add glass ${i + 1}`}
            />
          );
        })}
      </div>

      <span
        className="text-xs font-bold tabular-nums whitespace-nowrap"
        style={{ color: isFull ? "var(--accent-blue, #3b82f6)" : "var(--text-primary)" }}
      >
        {count}/{GOAL}
      </span>
    </button>
  );
}
