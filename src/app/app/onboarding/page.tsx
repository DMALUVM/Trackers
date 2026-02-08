"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listRoutineItems, createRoutineItemsBulk, setEnabledModules } from "@/lib/supabaseData";
import { templatePacks } from "@/lib/templates";
import { hapticMedium, hapticHeavy } from "@/lib/haptics";
import { BrandIcon } from "@/app/app/_components/BrandIcon";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [step, setStep] = useState(0); // 0 = welcome, 1 = how it works, 2 = pick template

  useEffect(() => {
    void (async () => {
      const items = await listRoutineItems();
      if (items.length > 0) { router.replace("/app/today"); return; }
      setLoading(false);
    })();
  }, [router]);

  const quickStart = async (templateId: string) => {
    setBusy(templateId);
    hapticHeavy();
    try {
      const pack = templatePacks.find((p) => p.id === templateId);
      if (!pack) throw new Error("Template not found");
      const coreIds = pack.routines.filter((r) => r.defaultCore).map((r) => r.id);
      const base = pack.routines.map((r) => ({
        label: r.label, emoji: r.emoji ?? null, section: r.section ?? "anytime",
        isNonNegotiable: coreIds.includes(r.id), daysOfWeek: r.daysOfWeek ?? null,
      }));
      const addons = (pack.addons ?? []).filter((a) => a.defaultOn).map((a) => ({
        label: a.label, emoji: a.emoji ?? null, section: a.section ?? "anytime",
        isNonNegotiable: false, daysOfWeek: a.daysOfWeek ?? null,
      }));
      await setEnabledModules(["progress", "settings", ...(pack.modules as string[] ?? [])]);
      await createRoutineItemsBulk({
        items: [...base, ...addons].map((it, idx) => ({ ...it, sortOrder: idx })),
      });
      localStorage.removeItem("routines365:gettingStarted:dismissed");
      router.replace("/app/today");
    } catch {
      setBusy("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3 animate-fade-in">
          <div className="mx-auto" style={{ width: 64 }}>
            <BrandIcon size={64} />
          </div>
          <p className="text-base" style={{ color: "var(--text-muted)" }}>Getting things ready…</p>
        </div>
      </div>
    );
  }

  // ─── STEP 0: Welcome ───
  if (step === 0) {
    return (
      <div className="space-y-6 animate-fade-in pt-8">
        <header className="text-center space-y-4">
          <div className="mx-auto" style={{ width: 80 }}>
            <BrandIcon size={80} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Welcome! 👋
            </h1>
            <p className="mt-3 text-lg leading-relaxed mx-auto max-w-xs" style={{ color: "var(--text-secondary)" }}>
              You&apos;re about to build a daily routine that sticks.
            </p>
          </div>
        </header>

        <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <p className="text-base font-bold mb-3" style={{ color: "var(--text-primary)" }}>Here&apos;s how it works:</p>
          <div className="space-y-4">
            {[
              { emoji: "✅", title: "Pick your daily habits", desc: "We'll give you a starter set — you can always change them later." },
              { emoji: "⭐", title: "Some habits are \"Core\"", desc: "These are your must-dos. Complete all core habits = a green day." },
              { emoji: "📅", title: "Track every day", desc: "Open the app, check off what you did. Takes about 10 seconds." },
              { emoji: "🔥", title: "Build streaks", desc: "Consecutive green days build streaks. Watch consistency compound." },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="text-xl shrink-0 mt-0.5">{emoji}</span>
                <div>
                  <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{title}</p>
                  <p className="text-sm mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="button"
          className="w-full rounded-2xl py-4 text-lg font-bold transition-all active:scale-[0.98]"
          style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}
          onClick={() => { hapticMedium(); setStep(1); }}>
          Let&apos;s get started →
        </button>
      </div>
    );
  }

  // ─── STEP 1: Pick your starting routine ───
  return (
    <div className="space-y-5 animate-fade-in">
      <header className="text-center space-y-2 pt-4">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Pick a Starter Routine
        </h1>
        <p className="text-base leading-relaxed mx-auto max-w-xs" style={{ color: "var(--text-secondary)" }}>
          Choose one to start with. You can add, remove, or change any habit later — nothing is permanent!
        </p>
      </header>

      {/* Quick start templates */}
      <section className="space-y-3">
        <p className="text-sm font-bold uppercase tracking-wider px-1" style={{ color: "var(--text-faint)" }}>
          Most popular — one tap to start
        </p>

        {[
          { id: "morning-reset-10", emoji: "⚡", title: "Morning Reset", subtitle: "Water, sunlight, movement, plan your day", habits: "10 habits · 5 core", tag: "Recommended" },
          { id: "fitness-consistency", emoji: "🏋️", title: "Fitness Focus", subtitle: "Workout, walk, protein, hydration", habits: "8 habits · 4 core", tag: null },
        ].map(({ id, emoji, title, subtitle, habits, tag }) => (
          <button key={id} type="button" disabled={!!busy}
            className="w-full rounded-2xl p-5 text-left transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              background: tag ? "var(--accent-green-soft)" : "var(--bg-card)",
              border: `2px solid ${tag ? "var(--accent-green)" : "var(--border-primary)"}`,
            }}
            onClick={() => void quickStart(id)}>
            <div className="flex items-center gap-4">
              <div className="shrink-0 flex items-center justify-center rounded-xl"
                style={{
                  width: 52, height: 52, fontSize: 26,
                  background: tag ? "var(--accent-green)" : "var(--bg-card-hover)",
                }}>
                {busy === id ? (
                  <span className="h-5 w-5 rounded-full border-2 animate-spin"
                    style={{ borderColor: "var(--text-faint)", borderTopColor: "var(--text-primary)" }} />
                ) : emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{title}</p>
                  {tag && (
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>
                      {tag}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
                <p className="mt-0.5 text-xs font-medium" style={{ color: "var(--text-faint)" }}>{habits}</p>
              </div>
            </div>
          </button>
        ))}
      </section>

      {/* Other options */}
      <section className="space-y-3">
        <p className="text-sm font-bold uppercase tracking-wider px-1" style={{ color: "var(--text-faint)" }}>
          Or customize your own
        </p>

        <button type="button" disabled={!!busy}
          className="card-interactive w-full p-4 text-left"
          onClick={() => {
            hapticMedium();
            localStorage.removeItem("routines365:gettingStarted:dismissed");
            router.push("/app/onboarding/goal");
          }}>
          <div className="flex items-center gap-4">
            <div className="shrink-0 flex items-center justify-center rounded-xl"
              style={{ width: 48, height: 48, background: "var(--bg-card-hover)", fontSize: 22 }}>
              🎯
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Pick a goal → get matched</p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Tell us your focus (Energy, Fitness, Focus, or Sleep) and we&apos;ll suggest the right habits.
              </p>
            </div>
          </div>
        </button>

        <button type="button" disabled={!!busy}
          className="card-interactive w-full p-4 text-left"
          onClick={() => {
            hapticMedium();
            localStorage.removeItem("routines365:gettingStarted:dismissed");
            router.push("/app/settings/routines/library?from=onboarding");
          }}>
          <div className="flex items-center gap-4">
            <div className="shrink-0 flex items-center justify-center rounded-xl"
              style={{ width: 48, height: 48, background: "var(--bg-card-hover)", fontSize: 22 }}>
              📚
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Browse the full library</p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                76 habits across Morning, Fitness, Nutrition, Recovery, Mindfulness, and more.
              </p>
            </div>
          </div>
        </button>

        <button type="button" disabled={!!busy}
          className="card-interactive w-full p-4 text-left"
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
              <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Start blank</p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Already know your habits? Type them in one by one.
              </p>
            </div>
          </div>
        </button>
      </section>

      {/* Back button */}
      <button type="button" onClick={() => setStep(0)}
        className="w-full text-center text-sm py-3"
        style={{ color: "var(--text-faint)" }}>
        ← Back
      </button>

      <p className="text-center text-sm pb-4" style={{ color: "var(--text-faint)" }}>
        You can change everything anytime in Settings.
      </p>
    </div>
  );
}
