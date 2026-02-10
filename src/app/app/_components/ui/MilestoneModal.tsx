"use client";

import { useEffect, useState } from "react";
import type { Milestone } from "@/lib/milestones";
import { hapticHeavy } from "@/lib/haptics";

/**
 * Full-screen celebration overlay when a milestone is earned.
 * 
 * Psychology: "Peak-end rule" — people remember the most intense
 * moment and the end of an experience. This IS the peak moment.
 * Make it feel EARNED, not just informational.
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

  const dismiss = () => {
    setPhase("exit");
    setTimeout(() => { setVisible(false); onDismiss(); }, 300);
  };

  // Lock body scroll when modal is visible
  useEffect(() => {
    if (!visible) return;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      window.scrollTo(0, scrollY);
    };
  }, [visible]);

  if (!visible || !milestone) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={dismiss}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
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
            {milestone.type === "streak" ? `${milestone.threshold}-day streak` :
             milestone.type === "green_total" ? `${milestone.threshold} green days` :
             "New personal best"}
          </span>
        </div>

        {/* Dismiss button */}
        <button type="button" onClick={dismiss}
          className="mt-8 w-full rounded-2xl py-4 text-sm font-bold text-black transition-transform active:scale-[0.97]"
          style={{
            background: "white",
            animation: phase === "show" ? "fade-in-up 0.5s ease-out 0.25s both" : undefined,
          }}>
          Keep going →
        </button>
      </div>
    </div>
  );
}
