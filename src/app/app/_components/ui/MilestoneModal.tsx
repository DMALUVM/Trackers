"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Share2 } from "lucide-react";
import type { Milestone } from "@/lib/milestones";
import { popPendingMilestone } from "@/lib/milestones";
import { hapticHeavy, hapticMedium } from "@/lib/haptics";

/**
 * Full-screen celebration overlay when a milestone is earned.
 * 
 * Psychology: "Peak-end rule" — people remember the most intense
 * moment and the end of an experience. This IS the peak moment.
 * Make it feel EARNED, not just informational.
 * 
 * Fixes applied:
 * - Inline centering (no reliance on modal-center class)
 * - Scroll lock uses overflow:hidden instead of position:fixed (prevents iOS lockup)
 * - Queue support: after dismissing, checks for additional pending milestones
 */
export function MilestoneModal({
  milestone,
  onDismiss,
}: {
  milestone: Milestone | null;
  onDismiss: () => void;
}) {
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!milestone) { setVisible(false); setPhase("enter"); return; }
    setVisible(true);
    setPhase("enter");
    hapticHeavy();
    // Small delay for entrance animation
    const t1 = setTimeout(() => setPhase("show"), 50);
    return () => clearTimeout(t1);
  }, [milestone]);

  const dismiss = useCallback(() => {
    setPhase("exit");
    setTimeout(() => {
      setVisible(false);
      onDismiss();
      // Check for queued milestones after a brief pause
      // (let the UI settle before showing the next one)
      setTimeout(() => {
        const next = popPendingMilestone();
        if (next) {
          // Re-trigger by calling the parent's milestone setter
          // We dispatch a custom event that the Today page listens for
          window.dispatchEvent(new CustomEvent("routines365:showMilestone", { detail: next }));
        }
      }, 600);
    }, 300);
  }, [onDismiss]);

  // Lock body scroll when modal is visible — use overflow:hidden instead of
  // position:fixed to avoid iOS visual lockup and scroll position jumping
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = prev;
      document.body.style.touchAction = prevTouch;
    };
  }, [visible]);

  if (!visible || !milestone) return null;

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      onClick={dismiss}
      // ── FIX: Inline centering — no reliance on modal-center class ──
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        zIndex: 9999,
        background: phase === "show" ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0)",
        backdropFilter: phase === "show" ? "blur(8px)" : "blur(0)",
        WebkitBackdropFilter: phase === "show" ? "blur(8px)" : "blur(0)",
        transition: "all 0.3s ease",
      }}
    >
      <div
        className="w-full max-w-sm text-center"
        style={{
          transform: phase === "show" ? "scale(1) translateY(0)" : phase === "enter" ? "scale(0.8) translateY(30px)" : "scale(0.9) translateY(-20px)",
          opacity: phase === "show" ? 1 : 0,
          transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ring behind emoji */}
        <div className="relative mx-auto" style={{ width: 120, height: 120 }}>
          <div className="absolute inset-0 rounded-full animate-pulse"
            style={{
              background: milestone.type === "streak"
                ? "radial-gradient(circle, rgba(251,191,36,0.3), transparent 70%)"
                : milestone.type === "personal_best"
                  ? "radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%)"
                  : "radial-gradient(circle, rgba(16,185,129,0.3), transparent 70%)",
              transform: "scale(1.8)",
            }} />
          <div className="relative flex items-center justify-center w-full h-full rounded-full"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "2px solid rgba(255,255,255,0.15)",
              fontSize: 56,
              animation: phase === "show" ? "milestone-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s both" : undefined,
            }}>
            {milestone.emoji}
          </div>
        </div>

        {/* Title */}
        <h2 className="mt-6 text-2xl font-black tracking-tight text-white"
          style={{
            animation: phase === "show" ? "fade-in-up 0.5s ease-out 0.1s both" : undefined,
          }}>
          {milestone.title}
        </h2>

        {/* Message */}
        <p className="mt-3 text-base text-neutral-300 leading-relaxed px-4"
          style={{
            animation: phase === "show" ? "fade-in-up 0.5s ease-out 0.15s both" : undefined,
          }}>
          {milestone.message}
        </p>

        {/* Threshold badge */}
        <div className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            animation: phase === "show" ? "fade-in-up 0.5s ease-out 0.2s both" : undefined,
          }}>
          <span className="text-sm font-bold text-white tabular-nums">
            {milestone.type === "streak"
              ? `${(milestone as Record<string, unknown>)._displayStreak ?? milestone.threshold}-day streak`
              : milestone.type === "green_total" ? `${milestone.threshold} green days`
              : "New personal best"}
          </span>
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex gap-3 w-full"
          style={{ animation: phase === "show" ? "fade-in-up 0.5s ease-out 0.25s both" : undefined }}>
          <button type="button"
            onClick={(e) => {
              e.stopPropagation();
              hapticMedium();
              const streakCount = (milestone as Record<string, unknown>)._displayStreak as number ?? milestone.threshold;
              const text = milestone.type === "streak"
                ? `🔥 ${streakCount}-day streak on Routines365! ${milestone.message}`
                : milestone.type === "green_total"
                  ? `🏆 ${milestone.threshold} green days on Routines365! ${milestone.message}`
                  : `⭐ New personal best on Routines365! ${milestone.message}`;
              if (typeof navigator.share === "function") {
                navigator.share({ title: "Routines365 Milestone", text, url: "https://routines365.com" }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(text).catch(() => {});
              }
            }}
            className="flex-1 rounded-2xl py-4 text-sm font-bold transition-transform active:scale-[0.97] flex items-center justify-center gap-2"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "white",
            }}>
            <Share2 size={16} /> Share
          </button>
          <button type="button" onClick={dismiss}
            className="flex-[2] rounded-2xl py-4 text-sm font-bold text-black transition-transform active:scale-[0.97]"
            style={{ background: "white" }}>
            Keep going →
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
