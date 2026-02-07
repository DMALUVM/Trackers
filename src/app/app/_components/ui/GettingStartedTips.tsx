"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { hapticLight } from "@/lib/haptics";

/**
 * First-time user tips — shown once after onboarding.
 *
 * Psychology: "Learned helplessness" prevention. If users don't
 * discover features like swipe-to-complete, they think the app
 * is simpler than it is. Brief, visual tips front-load the "aha."
 *
 * Shows 3 tips in sequence, then self-dismisses forever.
 */
const TIPS = [
  {
    emoji: "👆",
    title: "Tap to check off",
    desc: "Tap any habit to mark it done. Complete all core habits for a green day.",
  },
  {
    emoji: "👉",
    title: "Swipe right to complete",
    desc: "Swipe a habit right to check it off, or left to skip it for today.",
  },
  {
    emoji: "🔥",
    title: "Build your streak",
    desc: "Consecutive green days build a streak. Hit milestones at 3, 7, 14, 21, 30 days and beyond.",
  },
];

const LS_KEY = "routines365:tips:dismissed";

export function GettingStartedTips() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Only show if not dismissed AND user has gone through onboarding
    const dismissed = localStorage.getItem(LS_KEY) === "1";
    const hasRoutines = localStorage.getItem("routines365:gettingStarted:dismissed") !== "1";
    // Show tips if onboarding was just completed (gettingStarted not dismissed means just finished)
    if (!dismissed && hasRoutines) {
      setTimeout(() => setVisible(true), 1500); // Wait for page to settle
    }
  }, []);

  const dismiss = () => {
    hapticLight();
    localStorage.setItem(LS_KEY, "1");
    setVisible(false);
  };

  const next = () => {
    hapticLight();
    if (step < TIPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const tip = TIPS[step];

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center p-4 pb-24"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={dismiss}>
      <div
        className="w-full max-w-sm rounded-2xl p-6 animate-fade-in-up"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}
        onClick={(e) => e.stopPropagation()}>
        
        {/* Close button */}
        <button type="button" onClick={dismiss}
          className="absolute top-3 right-3 p-2 rounded-full"
          style={{ color: "var(--text-faint)" }}>
          <X size={16} />
        </button>

        <div className="text-center space-y-3">
          <div className="text-4xl">{tip.emoji}</div>
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{tip.title}</h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{tip.desc}</p>
        </div>

        {/* Progress dots + next button */}
        <div className="mt-5 flex items-center justify-between">
          <div className="flex gap-1.5">
            {TIPS.map((_, i) => (
              <div key={i} className="rounded-full transition-all duration-200"
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  background: i === step ? "var(--accent-green)" : "var(--bg-card-hover)",
                }} />
            ))}
          </div>
          <button type="button" onClick={next}
            className="rounded-xl px-5 py-2.5 text-sm font-bold transition-transform active:scale-[0.97]"
            style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>
            {step < TIPS.length - 1 ? "Next" : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );
}
