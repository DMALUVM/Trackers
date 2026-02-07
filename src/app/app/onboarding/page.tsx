"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listRoutineItems, createRoutineItemsBulk, setEnabledModules } from "@/lib/supabaseData";
import { templatePacks } from "@/lib/templates";
import { hapticMedium, hapticHeavy } from "@/lib/haptics";
import { BrandIcon } from "@/app/app/_components/BrandIcon";

/**
 * Onboarding welcome — the user's first impression.
 *
 * Design goals:
 * 1. Excitement: "You're about to level up" energy.
 * 2. Speed: One-tap Quick Start gets you into the app in 3 seconds.
 * 3. Optionality: Customize path exists but doesn't slow anyone down.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    void (async () => {
      const items = await listRoutineItems();
      if (items.length > 0) { router.replace("/app/today"); return; }
      setLoading(false);
    })();
  }, [router]);

  // One-tap quick start: applies a template instantly
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
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Preparing your space…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero — excitement first */}
      <header className="text-center space-y-4 pt-6">
        <div className="mx-auto" style={{ width: 72 }}>
          <BrandIcon size={72} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Let&apos;s go 🔥
          </h1>
          <p className="mt-2 text-sm leading-relaxed mx-auto max-w-xs" style={{ color: "var(--text-secondary)" }}>
            Pick a starter routine and you&apos;re in. Customize everything later — nothing is permanent.
          </p>
        </div>
      </header>

      {/* Quick start options — the fastest path */}
      <section className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
          One tap to start
        </p>

        {[
          { id: "morning-reset-10", emoji: "⚡", title: "Morning Reset", subtitle: "Water, sunlight, movement, plan your day", tag: "Most popular" },
          { id: "fitness-consistency", emoji: "🏋️", title: "Fitness Focus", subtitle: "Workout, walk, protein, hydration", tag: null },
        ].map(({ id, emoji, title, subtitle, tag }) => (
          <button key={id} type="button" disabled={!!busy}
            className="w-full rounded-2xl p-5 text-left transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              background: tag ? "var(--accent-green-soft)" : "var(--bg-card)",
              border: `1px solid ${tag ? "var(--accent-green)" : "var(--border-primary)"}`,
            }}
            onClick={() => void quickStart(id)}>
            <div className="flex items-center gap-4">
              <div className="shrink-0 flex items-center justify-center rounded-xl"
                style={{
                  width: 48, height: 48, fontSize: 24,
                  background: tag ? "var(--accent-green)" : "var(--bg-card-hover)",
                }}>
                {busy === id ? (
                  <span className="h-5 w-5 rounded-full border-2 animate-spin"
                    style={{ borderColor: "var(--text-faint)", borderTopColor: "var(--text-primary)" }} />
                ) : emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{title}</p>
                  {tag && (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>
                      {tag}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
              </div>
            </div>
          </button>
        ))}
      </section>

      {/* More options — secondary path */}
      <section className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
          Or customize your way
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
              style={{ width: 44, height: 44, background: "var(--bg-card-hover)", fontSize: 20 }}>
              🎯
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Pick a goal → get matched</p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-faint)" }}>
                Energy, Fitness, Focus, or Sleep templates
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
              style={{ width: 44, height: 44, background: "var(--bg-card-hover)", fontSize: 20 }}>
              ✏️
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Build from scratch</p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-faint)" }}>
                You know exactly what you want
              </p>
            </div>
          </div>
        </button>
      </section>

      {/* Reassurance */}
      <p className="text-center text-xs pb-4" style={{ color: "var(--text-faint)" }}>
        Takes 5 seconds. Change everything anytime.
      </p>
    </div>
  );
}
