"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listRoutineItems } from "@/lib/supabaseData";
import { hapticMedium } from "@/lib/haptics";

/**
 * Onboarding welcome — the user's first impression.
 *
 * Psychology: "Implementation intention" — asking "WHEN will you do X?"
 * doubles follow-through vs just deciding to do X. We don't just ask
 * "what habits?" — we frame it as "what kind of person are you building?"
 *
 * Also: Zeigarnik effect — once you start a process, your brain
 * wants to complete it. The step indicator creates that pull.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const items = await listRoutineItems();
      if (items.length > 0) { router.replace("/app/today"); return; }
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3 animate-fade-in">
          <div className="text-4xl">🌱</div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Preparing your space…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 rounded-full" style={{ background: "var(--accent-green)" }} />
        <div className="h-1 flex-1 rounded-full" style={{ background: "var(--bg-card-hover)" }} />
        <div className="h-1 flex-1 rounded-full" style={{ background: "var(--bg-card-hover)" }} />
        <div className="h-1 flex-1 rounded-full" style={{ background: "var(--bg-card-hover)" }} />
      </div>

      {/* Hero */}
      <header className="text-center space-y-3 py-4">
        <div className="text-5xl">🎯</div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
          Build your daily system
        </h1>
        <p className="text-sm leading-relaxed mx-auto max-w-xs" style={{ color: "var(--text-secondary)" }}>
          Pick the habits that matter most. You'll see them every day as a simple checklist. Most people are set up in 30 seconds.
        </p>
      </header>

      {/* Actions */}
      <section className="space-y-3">
        <button type="button"
          className="w-full rounded-2xl p-5 text-left transition-transform active:scale-[0.98]"
          style={{ background: "var(--accent-green-soft)", border: "1px solid var(--accent-green)" }}
          onClick={() => {
            hapticMedium();
            localStorage.removeItem("routines365:gettingStarted:dismissed");
            router.push("/app/onboarding/goal");
          }}>
          <div className="flex items-center gap-4">
            <div className="shrink-0 flex items-center justify-center rounded-xl"
              style={{ width: 48, height: 48, background: "var(--accent-green)", fontSize: 22 }}>
              ⚡
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Start with a template</p>
              <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                Pick a goal → get a ready-made routine
              </p>
            </div>
          </div>
        </button>

        <button type="button"
          className="card-interactive w-full p-5 text-left"
          onClick={() => {
            hapticMedium();
            localStorage.removeItem("routines365:gettingStarted:dismissed");
            router.replace("/app/settings/routines");
          }}>
          <div className="flex items-center gap-4">
            <div className="shrink-0 flex items-center justify-center rounded-xl"
              style={{ width: 48, height: 48, background: "var(--bg-card-hover)", fontSize: 22 }}>
              ✏️
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Build from scratch</p>
              <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                You know exactly what you want to track
              </p>
            </div>
          </div>
        </button>
      </section>

      {/* Reassurance */}
      <p className="text-center text-xs" style={{ color: "var(--text-faint)" }}>
        You can change everything later. Nothing is permanent.
      </p>
    </div>
  );
}
