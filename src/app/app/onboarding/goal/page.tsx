"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listRoutineItems } from "@/lib/supabaseData";
import { hapticMedium } from "@/lib/haptics";
import { OnboardingProgress } from "@/app/app/_components/ui/OnboardingProgress";

type Goal = "energy" | "fitness" | "focus" | "sleep";

const GOALS: Array<{ key: Goal; title: string; desc: string; emoji: string; identity: string }> = [
  { key: "energy",  title: "Energy",  desc: "A simple baseline that makes every day better.",     emoji: "⚡", identity: "Someone who takes care of themselves" },
  { key: "fitness", title: "Fitness", desc: "Movement, workouts, and metrics you can watch grow.", emoji: "🏋️", identity: "An athlete in training" },
  { key: "focus",   title: "Focus",   desc: "Less noise, more deep work, clean shutdowns.",       emoji: "🎯", identity: "Someone who protects their attention" },
  { key: "sleep",   title: "Sleep",   desc: "Wind-down routines and recovery tracking.",           emoji: "😴", identity: "Someone who prioritizes rest" },
];

export default function OnboardingGoalPage() {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  useEffect(() => {
    void (async () => {
      const items = await listRoutineItems();
      if (items.length > 0) router.replace("/app/today");
    })();
  }, [router]);

  const choose = (g: Goal) => {
    setBusy(g);
    hapticMedium();
    try { localStorage.setItem("routines365:onboarding:goal", g); router.push("/app/onboarding/templates"); }
    finally { setBusy(""); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <OnboardingProgress current={1} />

      <header className="text-center space-y-2">
        <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
          What are you building toward?
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Pick one. We'll suggest habits that match.
        </p>
      </header>

      <section className="space-y-3">
        {GOALS.map((g) => (
          <button key={g.key} type="button" disabled={!!busy} onClick={() => choose(g.key)}
            className="w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-primary)",
            }}>
            <div className="flex items-center gap-4">
              <div className="shrink-0 flex items-center justify-center rounded-xl"
                style={{ width: 48, height: 48, background: "var(--bg-card-hover)", fontSize: 24 }}>
                {g.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{g.title}</p>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{g.desc}</p>
                <p className="text-xs mt-1 italic" style={{ color: "var(--text-faint)" }}>
                  "{g.identity}"
                </p>
              </div>
            </div>
          </button>
        ))}
      </section>
    </div>
  );
}
