"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { templatePacks, type OnboardingGoal } from "@/lib/templates";
import { createRoutineItemsBulk, listRoutineItems, setEnabledModules } from "@/lib/supabaseData";

export default function TemplatePickerPage() {
  const router = useRouter();
  const [busy, setBusy] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const run = async () => {
      const items = await listRoutineItems();
      if (items.length > 0) {
        router.replace("/app/today");
      }
    };
    void run();
  }, [router]);

  const getGoal = (): OnboardingGoal | null => {
    try {
      const raw = localStorage.getItem("routines365:onboarding:goal");
      if (!raw) return null;
      if (["energy", "fitness", "focus", "sleep"].includes(raw)) return raw as OnboardingGoal;
      return null;
    } catch {
      return null;
    }
  };

  const enableModulesForGoal = async (goal: OnboardingGoal | null, packModules?: string[]) => {
    // Always include settings + progress; keep it tight.
    const base = new Set<string>(["progress", "settings"]);

    if (goal === "fitness") {
      base.add("rowing");
      base.add("cardio");
      base.add("recovery");
    } else if (goal === "energy") {
      base.add("cardio");
      base.add("recovery");
    } else if (goal === "sleep") {
      base.add("recovery");
    } else if (goal === "focus") {
      // minimal
    }

    // allow template to request modules too
    for (const m of packModules ?? []) base.add(m);

    const next = Array.from(base);
    try {
      await setEnabledModules(next);
    } catch {
      // ignore
    }
  };

  const applyTemplate = async (id: string) => {
    setBusy(id);
    setError("");
    try {
      const pack = templatePacks.find((p) => p.id === id);
      if (!pack) throw new Error("Template not found");

      // store selection, then move into CORE selection
      localStorage.setItem("routines365:onboarding:templateId", id);
      const defaultCore = pack.routines.filter((r) => r.defaultCore).map((r) => r.id);
      localStorage.setItem("routines365:onboarding:coreIds", JSON.stringify(defaultCore));

      router.push("/app/onboarding/core");
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy("");
    }
  };

  const quickStart = async (id: string) => {
    setBusy(id);
    setError("");
    try {
      const pack = templatePacks.find((p) => p.id === id);
      if (!pack) throw new Error("Template not found");

      const goal = getGoal();
      await enableModulesForGoal(goal, pack.modules as any);

      const coreIds = pack.routines.filter((r) => r.defaultCore).map((r) => r.id);

      const base = pack.routines.map((r) => ({
        label: r.label,
        emoji: r.emoji ?? null,
        section: r.section ?? "anytime",
        isNonNegotiable: coreIds.includes(r.id),
        daysOfWeek: r.daysOfWeek ?? null,
      }));

      // Keep add-ons minimal by default; user can add more later.
      const defaultAddons = (pack.addons ?? []).filter((a) => a.defaultOn);
      const addons = defaultAddons.map((a) => ({
        label: a.label,
        emoji: a.emoji ?? null,
        section: a.section ?? "anytime",
        isNonNegotiable: false,
        daysOfWeek: a.daysOfWeek ?? null,
      }));

      const items = [...base, ...addons];
      await createRoutineItemsBulk({ items: items.map((it, idx) => ({ ...it, sortOrder: idx })) });

      localStorage.removeItem("routines365:gettingStarted:dismissed");
      localStorage.removeItem("routines365:onboarding:templateId");
      localStorage.removeItem("routines365:onboarding:coreIds");

      router.replace("/app/today");
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Templates</h1>
        <p className="text-sm text-neutral-400">Pick a starter pack. You can edit everything later.</p>
        {(() => {
          const g = getGoal();
          const name = g === "energy" ? "Energy" : g === "fitness" ? "Fitness" : g === "focus" ? "Focus" : g === "sleep" ? "Sleep" : null;
          if (!name) return null;
          return <p className="text-xs text-neutral-500">Recommended for: {name}</p>;
        })()}
        {error ? <p className="text-xs text-rose-300">Error: {error}</p> : null}
      </header>

      <section className="space-y-3">
        {(() => {
          const goal = getGoal();
          const general = templatePacks.filter((p) => (p.tier ?? "general") === "general");
          const recommended = goal
            ? general.filter((p) => (p.goals ?? []).includes(goal))
            : [];
          const rest = goal
            ? general.filter((p) => !(p.goals ?? []).includes(goal))
            : general;

          const Card = ({ p, badge }: { p: any; badge?: string }) => (
            <div
              key={p.id}
              className={
                "w-full rounded-2xl border p-4 text-left " +
                (badge ? "border-emerald-400/30 bg-emerald-500/5" : "border-white/10 bg-white/5")
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold">
                    {p.title}{" "}
                    {badge ? (
                      <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold text-emerald-200">
                        {badge}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-neutral-400">{p.desc}</p>
                </div>
                {busy === p.id ? <span className="text-xs text-neutral-400">Working…</span> : null}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => void quickStart(p.id)}
                  className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
                >
                  Quick start
                </button>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => void applyTemplate(p.id)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60"
                >
                  Customize
                </button>
              </div>
            </div>
          );

          return (
            <>
              {recommended.length > 0 ? (
                <>
                  <p className="text-xs font-semibold text-neutral-200">Recommended</p>
                  {recommended.map((p) => (
                    <Card key={p.id} p={p} badge="Recommended" />
                  ))}
                </>
              ) : null}

              {rest.length > 0 ? (
                <>
                  {recommended.length > 0 ? (
                    <p className="pt-2 text-xs font-semibold text-neutral-400">More templates</p>
                  ) : null}
                  {rest.map((p) => (
                    <Card key={p.id} p={p} />
                  ))}
                </>
              ) : null}
            </>
          );
        })()}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <button
            type="button"
            className="w-full text-left"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-200">Advanced templates</p>
              <span className="text-xs text-neutral-400">{showAdvanced ? "Hide" : "Show"}</span>
            </div>
            <p className="mt-1 text-xs text-neutral-500">More specific presets. Most people don’t need these.</p>
          </button>

          {showAdvanced ? (
            <div className="mt-4 space-y-3">
              {templatePacks
                .filter((p) => (p.tier ?? "general") === "advanced")
                .map((p) => (
                  <div
                    key={p.id}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-semibold">{p.title}</p>
                        <p className="mt-1 text-sm text-neutral-400">{p.desc}</p>
                      </div>
                      {busy === p.id ? (
                        <span className="text-xs text-neutral-400">Working…</span>
                      ) : (
                        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-neutral-200">
                          ADV
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={() => void quickStart(p.id)}
                        className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
                      >
                        Quick start
                      </button>
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={() => void applyTemplate(p.id)}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60"
                      >
                        Customize
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
