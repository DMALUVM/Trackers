"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listRoutineItems } from "@/lib/supabaseData";

type Goal = "energy" | "fitness" | "focus" | "sleep";

const GOALS: Array<{ key: Goal; title: string; desc: string; emoji: string }> = [
  { key: "energy", title: "Energy", desc: "Feel good daily with a simple baseline.", emoji: "⚡" },
  { key: "fitness", title: "Fitness", desc: "Movement + workouts, tracked with metrics.", emoji: "🏋️" },
  { key: "focus", title: "Focus", desc: "Less chaos, more deep work and shutdown.", emoji: "🎯" },
  { key: "sleep", title: "Sleep", desc: "Build consistency and recovery.", emoji: "😴" },
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
    try { localStorage.setItem("routines365:onboarding:goal", g); router.push("/app/onboarding/templates"); }
    finally { setBusy(""); }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Your goal</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Pick one. You can change anything later.</p>
      </header>

      <section className="space-y-3">
        {GOALS.map((g) => (
          <button key={g.key} type="button" disabled={!!busy} onClick={() => choose(g.key)}
            className="card-interactive w-full p-4 text-left disabled:opacity-60">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                  <span className="mr-2">{g.emoji}</span>{g.title}
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{g.desc}</p>
              </div>
              {busy === g.key && <span className="text-xs" style={{ color: "var(--text-muted)" }}>Choosing…</span>}
            </div>
          </button>
        ))}
      </section>

      <p className="text-xs" style={{ color: "var(--text-faint)" }}>
        We'll recommend a template and enable the right tabs. You can edit your routines anytime.
      </p>
    </div>
  );
}
