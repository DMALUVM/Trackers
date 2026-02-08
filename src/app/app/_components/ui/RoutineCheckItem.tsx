"use client";

import { useRef, useState, useCallback } from "react";
import { Check, Bell } from "lucide-react";
import { hapticMedium, hapticSuccess } from "@/lib/haptics";

export interface RoutineCheckItemProps {
  id: string;
  label: string;
  emoji?: string;
  isCore: boolean;
  done: boolean;
  snoozed?: boolean;
  hasMetric?: boolean;
  hasReminder?: boolean;
  justCompleted?: boolean;
  onToggle: (id: string) => void;
  onSkip?: (id: string) => void;
  onLogMetric?: (id: string) => void;
  onSetReminder?: (id: string) => void;
  compact?: boolean;
}

export function RoutineCheckItem({
  id,
  label,
  emoji,
  isCore,
  done,
  snoozed,
  hasMetric,
  hasReminder,
  justCompleted,
  onToggle,
  onSkip,
  onLogMetric,
  onSetReminder,
  compact = false,
}: RoutineCheckItemProps) {
  const [swipeX, setSwipeX] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number; locked: boolean } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, locked: false };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const start = touchStartRef.current;
    if (!start) return;
    const t = e.touches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // If vertical scroll dominates, bail
    if (!start.locked && Math.abs(dy) > Math.abs(dx)) { touchStartRef.current = null; return; }
    if (Math.abs(dx) > 8) start.locked = true;
    if (start.locked) setSwipeX(Math.max(-72, Math.min(72, dx)));
  }, []);

  const handleTouchEnd = useCallback(() => {
    const locked = touchStartRef.current?.locked;
    if (swipeX > 48 && !done) {
      hapticSuccess();
      onToggle(id);
    } else if (swipeX < -48 && onSkip && !done) {
      hapticMedium();
      onSkip(id);
    }
    setSwipeX(0);
    touchStartRef.current = null;
    // Return whether we were swiping (to suppress click)
    return locked;
  }, [swipeX, done, id, onToggle, onSkip]);

  const handleClick = useCallback(() => {
    // Don't fire if we just finished a swipe
    if (touchStartRef.current?.locked) return;
    if (!done) hapticMedium();
    onToggle(id);
  }, [done, id, onToggle]);

  if (snoozed) return null;

  const swipeRight = swipeX > 24;
  const swipeLeft = swipeX < -24;

  return (
    <div className="relative overflow-hidden rounded-2xl" id={`ri-${id}`}>
      {/* Swipe reveal layers */}
      <div className="absolute inset-0 flex items-center justify-between px-5"
        style={{ opacity: Math.abs(swipeX) > 12 ? 1 : 0, transition: "opacity 0.1s" }}>
        <span className="text-sm font-semibold" style={{
          color: "var(--accent-green)", opacity: swipeRight ? 1 : 0.3,
        }}>✓ Done</span>
        <span className="text-sm font-semibold" style={{
          color: "var(--text-muted)", opacity: swipeLeft ? 1 : 0.3,
        }}>Skip →</span>
      </div>

      {/* Main row */}
      <div
        role="checkbox"
        aria-checked={done}
        aria-label={`${label}${isCore ? " (core)" : ""}`}
        tabIndex={0}
        className="check-row relative flex items-center gap-3.5 px-4 transition-transform duration-150"
        style={{
          transform: `translateX(${swipeX}px)`,
          background: done ? "var(--accent-green-soft)" : "var(--bg-card)",
          border: `1px solid ${done ? "var(--accent-green)" : "var(--border-primary)"}`,
          borderRadius: "1rem",
          padding: compact ? "0.8rem 1rem" : "1rem 1rem",
          cursor: "pointer",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); } }}
      >
        {/* Checkbox circle */}
        <div className="shrink-0 flex items-center justify-center transition-all duration-200"
          style={{
            width: 32, height: 32, borderRadius: "50%",
            background: done ? "var(--accent-green)" : "transparent",
            border: done ? "none" : "2px solid var(--text-faint)",
            transform: justCompleted ? "scale(1.15)" : "scale(1)",
          }}>
          {done && <Check size={18} strokeWidth={3} style={{ color: "var(--text-inverse)" }} />}
        </div>

        {/* Emoji */}
        {emoji && <span className="text-xl shrink-0 select-none">{emoji}</span>}

        {/* Label */}
        <span className="flex-1 min-w-0 truncate font-medium transition-all duration-200"
          style={{
            fontSize: compact ? "1.0625rem" : "1.125rem",
            color: done ? "var(--accent-green-text)" : "var(--text-primary)",
            textDecoration: done ? "line-through" : "none",
            textDecorationColor: done ? "var(--accent-green)" : undefined,
            opacity: done ? 0.8 : 1,
          }}>
          {label}
        </span>

        {/* Core badge (only when undone — when done the green bg already signals importance) */}
        {isCore && !done && (
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide"
            style={{ background: "var(--bg-card-hover)", color: "var(--text-muted)" }}>
            CORE
          </span>
        )}

        {/* Metric prompt after completion */}
        {done && hasMetric && onLogMetric && (
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onLogMetric(id); }}
            className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors"
            style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}
            aria-label={`Log metric for ${label}`}>
            + Log
          </button>
        )}

        {/* Reminder bell */}
        {onSetReminder && (
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onSetReminder(id); }}
            className="shrink-0 flex items-center justify-center rounded-full transition-colors"
            style={{ width: 28, height: 28 }}
            aria-label={`${hasReminder ? "Edit" : "Set"} reminder for ${label}`}>
            <Bell size={14} strokeWidth={hasReminder ? 2.5 : 1.5}
              style={{ color: hasReminder ? "var(--accent-green)" : "var(--text-faint)" }} />
          </button>
        )}
      </div>
    </div>
  );
}
