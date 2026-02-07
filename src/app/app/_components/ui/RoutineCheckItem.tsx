"use client";

import { useRef, useState, useCallback } from "react";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";

export interface RoutineCheckItemProps {
  id: string;
  label: string;
  emoji?: string;
  isCore: boolean;
  done: boolean;
  snoozed?: boolean;
  /** Show a metric logging button */
  hasMetric?: boolean;
  /** Recently completed (triggers pulse animation) */
  justCompleted?: boolean;
  onToggle: (id: string) => void;
  onSkip?: (id: string) => void;
  onLogMetric?: (id: string) => void;
  /** Compact mode hides action buttons (used in full list) */
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
  justCompleted,
  onToggle,
  onSkip,
  onLogMetric,
  compact = false,
}: RoutineCheckItemProps) {
  const [swipeX, setSwipeX] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [swiping, setSwiping] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    setSwiping(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;

    // If vertical scroll is dominant, bail
    if (!swiping && Math.abs(dy) > Math.abs(dx)) {
      touchStartRef.current = null;
      return;
    }

    if (Math.abs(dx) > 10) setSwiping(true);

    // Swipe right → complete, swipe left → skip
    // Clamp to prevent over-swipe
    const clamped = Math.max(-80, Math.min(80, dx));
    setSwipeX(clamped);
  }, [swiping]);

  const handleTouchEnd = useCallback(() => {
    if (swipeX > 50 && !done) {
      onToggle(id);
    } else if (swipeX < -50 && onSkip && !done) {
      onSkip(id);
    }
    setSwipeX(0);
    setSwiping(false);
    touchStartRef.current = null;
  }, [swipeX, done, id, onToggle, onSkip]);

  if (snoozed) return null;

  const swipeRight = swipeX > 30;
  const swipeLeft = swipeX < -30;

  return (
    <div className="relative overflow-hidden rounded-xl" id={`ri-${id}`}>
      {/* Swipe background hints */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        <div
          className="flex items-center gap-2 text-sm font-semibold transition-opacity"
          style={{
            color: "var(--accent-green-text)",
            opacity: swipeRight ? 1 : 0,
          }}
        >
          <CheckCircle2 size={18} /> Done
        </div>
        <div
          className="flex items-center gap-2 text-sm font-semibold transition-opacity"
          style={{
            color: "var(--text-muted)",
            opacity: swipeLeft ? 1 : 0,
          }}
        >
          Skip <ChevronRight size={14} />
        </div>
      </div>

      {/* Main card content */}
      <div
        role="checkbox"
        aria-checked={done}
        aria-label={`${label}${isCore ? " (core)" : ""}`}
        tabIndex={0}
        className={
          "relative card-interactive px-4 py-3 transition-all duration-200 " +
          (done ? "opacity-60" : "") +
          (justCompleted ? " animate-check-pulse" : "")
        }
        style={{
          transform: `translateX(${swipeX}px)`,
          boxShadow: done ? `inset 0 0 0 2px var(--ring-check)` : undefined,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          // Only handle click if not swiping
          if (!swiping) onToggle(id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle(id);
          }
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {done ? (
              <CheckCircle2
                size={20}
                className="shrink-0 animate-check-pulse"
                style={{ color: "var(--accent-green)" }}
              />
            ) : (
              <Circle size={20} className="shrink-0" style={{ color: "var(--text-faint)" }} />
            )}

            {emoji && <span className="text-base shrink-0">{emoji}</span>}

            <span
              className={
                "text-sm font-medium truncate transition-all duration-200 " +
                (done ? "line-through" : "")
              }
              style={{ color: done ? "var(--text-muted)" : "var(--text-primary)" }}
            >
              {label}
            </span>

            {isCore && (
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  background: done ? "var(--accent-green-soft)" : "var(--bg-card-hover)",
                  color: done ? "var(--accent-green-text)" : "var(--text-muted)",
                }}
              >
                CORE
              </span>
            )}
          </div>

          {/* Quick actions (non-compact mode) */}
          {!compact && !done && hasMetric && onLogMetric && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLogMetric(id);
              }}
              className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold"
              style={{
                background: "var(--bg-card-hover)",
                color: "var(--text-muted)",
              }}
              aria-label={`Log metric for ${label}`}
            >
              + Log
            </button>
          )}
        </div>

        {/* Expanded actions for non-compact mode when not done */}
        {!compact && !done && (onSkip || (hasMetric && onLogMetric)) && (
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(id);
              }}
              className="btn-primary flex-1 text-center text-xs py-2"
            >
              Complete
            </button>
            {onSkip && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSkip(id);
                }}
                className="btn-secondary flex-1 text-center text-xs py-2"
              >
                Skip
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
