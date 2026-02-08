"use client";

import { useCallback, useEffect, useState } from "react";
import { addActivityLog, deleteActivityLogsForDate, sumActivity } from "@/lib/activity";
import { hapticLight } from "@/lib/haptics";

const GOAL = 8;

interface WaterTrackerProps {
  dateKey: string;
}

export function WaterTracker({ dateKey }: WaterTrackerProps) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [animatingIdx, setAnimatingIdx] = useState<number | null>(null);

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

  // Sync count to DB: wipe and re-insert as single row
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
    } catch {
      // queued offline
    }
  }, [dateKey]);

  const handleDotTap = useCallback((idx: number) => {
    const dotNumber = idx + 1; // 1-indexed
    let next: number;

    if (idx < count) {
      // Tapped a filled dot → unfill it (set count to this index)
      // If they tap the last filled dot, clear just that one
      next = idx;
    } else {
      // Tapped an empty dot → fill up to and including it
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

  if (loading) return null;

  const isFull = count >= GOAL;

  return (
    <div
      className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3"
      style={{
        background: isFull ? "var(--accent-blue-soft, rgba(59,130,246,0.1))" : "var(--bg-card)",
        border: `1px solid ${isFull ? "var(--accent-blue, #3b82f6)" : "var(--border-primary)"}`,
      }}
    >
      <span className="text-xl leading-none">💧</span>

      <div className="flex-1 flex items-center gap-1.5">
        {Array.from({ length: GOAL }).map((_, i) => {
          const filled = i < count;
          const isAnimating = i === animatingIdx;
          return (
            <button
              key={i}
              type="button"
              className="transition-all duration-200"
              style={{
                width: 22,
                height: 22,
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
              onClick={() => handleDotTap(i)}
              aria-label={filled ? `Remove glass ${i + 1}` : `Add glass ${i + 1}`}
            />
          );
        })}
      </div>

      <span
        className="text-sm font-bold tabular-nums whitespace-nowrap"
        style={{ color: isFull ? "var(--accent-blue, #3b82f6)" : "var(--text-primary)" }}
      >
        {count}/{GOAL}
      </span>
    </div>
  );
}
