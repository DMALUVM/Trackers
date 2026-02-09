"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { hapticLight, hapticMedium } from "@/lib/haptics";

/**
 * Comprehensive first-time user walkthrough.
 * Explains the core concepts new users MUST understand.
 */
const TIPS = [
  {
    emoji: "👆",
    title: "Tap to check off habits",
    desc: "Each day, open the app and tap your habits to mark them done. It takes about 10 seconds.",
  },
  {
    emoji: "⭐",
    title: "Core vs. Bonus habits",
    desc: "Core habits (marked CORE) are your must-dos. Bonus habits are nice-to-haves. Complete ALL your core habits to earn a green day.",
  },
  {
    emoji: "🟢",
    title: "What the colors mean",
    desc: "Green = all core done. Yellow = missed 1 core habit. Red = missed 2+. Your calendar and streak are based on green days.",
  },
  {
    emoji: "🔥",
    title: "Streaks build momentum",
    desc: "Consecutive green days build a streak. Hit milestones at 3, 7, 14, 21, and 30+ days to unlock trophies!",
  },
  {
    emoji: "⚙️",
    title: "Customize anytime",
    desc: "Tap the gear icon (⚙️) to access Settings. Add or remove habits, choose which are Core, enable Modules for detailed logging (Sleep, Fitness, etc.), and set up Quests to track weekly goals.",
  },
];

const LS_KEY = "routines365:tips:dismissed";

export function GettingStartedTips() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const dismissed = localStorage.getItem(LS_KEY) === "1";
    if (!dismissed) {
      setTimeout(() => setVisible(true), 1200);
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
      hapticMedium();
      dismiss();
    }
  };

  const prev = () => {
    hapticLight();
    if (step > 0) setStep((s) => s - 1);
  };

  if (!visible) return null;

  const tip = TIPS[step];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={dismiss}>
      <div
        className="w-full max-w-sm rounded-2xl p-6 animate-fade-in-up relative"
        style={{ background: "var(--bg-sheet)", border: "1px solid var(--border-primary)" }}
        onClick={(e) => e.stopPropagation()}>
        
        {/* Close button */}
        <button type="button" onClick={dismiss}
          className="absolute top-3 right-3 p-2 rounded-full"
          style={{ color: "var(--text-faint)" }}>
          <X size={18} />
        </button>

        {/* Step counter */}
        <p className="text-xs font-bold mb-3" style={{ color: "var(--text-faint)" }}>
          TIP {step + 1} OF {TIPS.length}
        </p>

        <div className="space-y-3">
          <div className="text-4xl">{tip.emoji}</div>
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{tip.title}</h3>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>{tip.desc}</p>
        </div>

        {/* Progress dots + nav buttons */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {TIPS.map((_, i) => (
              <div key={i} className="rounded-full transition-all duration-200"
                style={{
                  width: i === step ? 24 : 8,
                  height: 8,
                  background: i === step ? "var(--accent-green)" : i < step ? "var(--accent-green-soft)" : "var(--bg-card-hover)",
                }} />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" onClick={prev}
                className="rounded-xl px-4 py-2.5 text-sm font-bold"
                style={{ background: "var(--bg-card-hover)", color: "var(--text-secondary)" }}>
                Back
              </button>
            )}
            <button type="button" onClick={next}
              className="rounded-xl px-5 py-2.5 text-sm font-bold transition-transform active:scale-[0.97]"
              style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>
              {step < TIPS.length - 1 ? "Next" : "Start tracking!"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
