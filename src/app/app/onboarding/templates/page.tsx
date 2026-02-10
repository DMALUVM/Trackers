"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { templatePacks, type OnboardingGoal } from "@/lib/templates";
import { createRoutineItemsBulk, listRoutineItems, setEnabledModules } from "@/lib/supabaseData";
import { hapticMedium, hapticLight } from "@/lib/haptics";

export default function TemplatePickerPage() {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    void (async () => { const items = await listRoutineItems(); if (items.length > 0) router.replace("/app/today"); })();
  }, [router]);

  const getGoal = (): OnboardingGoal | null => {
    try {
      const raw = localStorage.getItem("routines365:onboarding:goal");
      if (!raw) return null;
      if (["energy", "fitness", "focus", "sleep"].includes(raw)) return raw as OnboardingGoal;
      return null;
    } catch { return null; }
  };

  const enableModulesForGoal = async (goal: OnboardingGoal | null, packModules?: string[]) => {
    const base = new Set<string>(["progress", "settings"]);
    if (goal === "fitness") { base.add("rowing"); base.add("cardio"); base.add("recovery"); }
    else if (goal === "energy") { base.add("cardio"); base.add("recovery"); }
    else if (goal === "sleep") { base.add("recovery"); }
    for (const m of packModules ?? []) base.add(m);
    try { await setEnabledModules(Array.from(base)); } catch { /* ignore */ }
  };

  const applyTemplate = async (id: string) => {
    setBusy(id); setError("");
    try {
      const pack = templatePacks.find((p) => p.id === id);
      if (!pack) throw new Error("Template not found");
      localStorage.setItem("routines365:onboarding:templateId", id);
      const defaultCore = pack.routines.filter((r) => r.defaultCore).map((r) => r.id);
      localStorage.setItem("routines365:onboarding:coreIds", JSON.stringify(defaultCore));
      router.push("/app/onboarding/core");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(""); }
  };

  const quickStart = async (id: string) => {
    setBusy(id); setError("");
    try {
      const pack = templatePacks.find((p) => p.id === id);
      if (!pack) throw new Error("Template not found");
      const goal = getGoal();
      await enableModulesForGoal(goal, pack.modules as string[] | undefined);
      const coreIds = pack.routines.filter((r) => r.defaultCore).map((r) => r.id);
      const base = pack.routines.map((r) => ({
        label: r.label, emoji: r.emoji ?? null, section: r.section ?? "anytime",
        isNonNegotiable: coreIds.includes(r.id), daysOfWeek: r.daysOfWeek ?? null,
      }));
      const defaultAddons = (pack.addons ?? []).filter((a) => a.defaultOn);
      const addons = defaultAddons.map((a) => ({
        label: a.label, emoji: a.emoji ?? null, section: a.section ?? "anytime",
        isNonNegotiable: false, daysOfWeek: a.daysOfWeek ?? null,
      }));
      await createRoutineItemsBulk({ items: [...base, ...addons].map((it, idx) => ({ ...it, sortOrder: idx })) });
      localStorage.removeItem("routines365:gettingStarted:dismissed");
      localStorage.removeItem("routines365:onboarding:templateId");
      localStorage.removeItem("routines365:onboarding:coreIds");
      router.replace("/app/today");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(""); }
  };

  const TemplateCard = ({ p, badge }: { p: (typeof templatePacks)[number]; badge?: string }) => (
    <div className="card-interactive w-full p-4 text-left"
      style={badge ? { borderColor: "var(--accent-green)", background: "var(--accent-green-soft)" } : undefined}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {p.title}{" "}
            {badge && <span className="ml-2 rounded-full px-2 py-1 text-[10px] font-semibold"
              style={{ background: "var(--accent-green-soft)", color: "var(--accent-green-text)" }}>{badge}</span>}
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{p.desc}</p>
        </div>
        {busy === p.id && <span className="text-xs" style={{ color: "var(--text-muted)" }}>Working…</span>}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" disabled={!!busy} onClick={() => { hapticMedium(); void quickStart(p.id); }}
          className="btn-primary text-sm py-3 disabled:opacity-60">Quick start</button>
        <button type="button" disabled={!!busy} onClick={() => { hapticLight(); void applyTemplate(p.id); }}
          className="btn-secondary text-sm py-3 disabled:opacity-60">Customize</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 rounded-full" style={{ background: "var(--accent-green)", opacity: 0.5 }} />
        <div className="h-1 flex-1 rounded-full" style={{ background: "var(--accent-green)", opacity: 0.5 }} />
        <div className="h-1 flex-1 rounded-full" style={{ background: "var(--accent-green)" }} />
        <div className="h-1 flex-1 rounded-full" style={{ background: "var(--bg-card-hover)" }} />
      </div>

      <header>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Templates</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Pick a starter pack. Edit everything later.</p>
        {(() => {
          const g = getGoal();
          const name = g === "energy" ? "Energy" : g === "fitness" ? "Fitness" : g === "focus" ? "Focus" : g === "sleep" ? "Sleep" : null;
          return name ? <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>Recommended for: {name}</p> : null;
        })()}
        {error && <p className="text-xs mt-1" style={{ color: "var(--accent-red-text)" }}>Error: {error}</p>}
      </header>

      <section className="space-y-3">
        {(() => {
          const goal = getGoal();
          const general = templatePacks.filter((p) => (p.tier ?? "general") === "general");
          const recommended = goal ? general.filter((p) => (p.goals ?? []).includes(goal)) : [];
          const rest = goal ? general.filter((p) => !(p.goals ?? []).includes(goal)) : general;
          return (
            <>
              {recommended.length > 0 && (
                <>
                  <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Recommended</p>
                  {recommended.map((p) => <TemplateCard key={p.id} p={p} badge="Recommended" />)}
                </>
              )}
              {rest.length > 0 && (
                <>
                  {recommended.length > 0 && <p className="pt-2 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>More templates</p>}
                  {rest.map((p) => <TemplateCard key={p.id} p={p} />)}
                </>
              )}
            </>
          );
        })()}

        <div className="card p-4">
          <button type="button" className="w-full text-left" onClick={() => { hapticLight(); setShowAdvanced((v) => !v); }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Advanced templates</p>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{showAdvanced ? "Hide" : "Show"}</span>
            </div>
            <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>More specific presets. Most people don't need these.</p>
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-3">
              {templatePacks.filter((p) => (p.tier ?? "general") === "advanced").map((p) => (
                <TemplateCard key={p.id} p={p} badge="ADV" />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
