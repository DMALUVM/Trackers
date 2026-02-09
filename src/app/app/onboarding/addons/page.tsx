"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { templatePacks } from "@/lib/templates";
import { createRoutineItemsBulk, listRoutineItems, setEnabledModules } from "@/lib/supabaseData";

const LS_TEMPLATE = "routines365:onboarding:templateId";
const LS_CORE = "routines365:onboarding:coreIds";

export default function OnboardingAddonsPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [coreIds, setCoreIds] = useState<string[]>([]);
  const [addonIds, setAddonIds] = useState<string[]>([]);

  useEffect(() => {
    void (async () => { const items = await listRoutineItems(); if (items.length > 0) router.replace("/app/today"); })();
  }, [router]);

  useEffect(() => {
    try {
      setTemplateId(localStorage.getItem(LS_TEMPLATE) ?? "");
      const rawCore = localStorage.getItem(LS_CORE);
      setCoreIds(rawCore ? JSON.parse(rawCore) : []);
    } catch { /* ignore */ }
  }, []);

  const pack = useMemo(() => templatePacks.find((p) => p.id === templateId), [templateId]);

  useEffect(() => { if (!templateId) router.replace("/app/onboarding/templates"); }, [router, templateId]);
  useEffect(() => {
    if (!pack?.addons) return;
    setAddonIds(pack.addons.filter((a) => a.defaultOn).map((a) => a.id));
  }, [pack]);

  const toggleAddon = (id: string) => setAddonIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const finish = async () => {
    if (!pack) return;
    if (coreIds.length === 0) { router.replace("/app/onboarding/core"); return; }
    setBusy(true); setError("");
    try {
      const goal = (() => { try { return localStorage.getItem("routines365:onboarding:goal"); } catch { return null; } })();
      const mods = new Set<string>(["progress", "settings"]);
      if (goal === "fitness") { mods.add("rowing"); mods.add("cardio"); mods.add("recovery"); }
      else if (goal === "energy") { mods.add("cardio"); mods.add("recovery"); }
      else if (goal === "sleep") { mods.add("recovery"); }
      for (const m of (pack.modules as string[] ?? [])) mods.add(m);
      await setEnabledModules(Array.from(mods));

      const base = pack.routines.map((r) => ({
        label: r.label, emoji: r.emoji ?? null, section: r.section ?? "anytime",
        isNonNegotiable: coreIds.includes(r.id), daysOfWeek: r.daysOfWeek ?? null,
      }));
      const addons = (pack.addons ?? []).filter((a) => addonIds.includes(a.id)).map((a) => ({
        label: a.label, emoji: a.emoji ?? null, section: a.section ?? "anytime",
        isNonNegotiable: false, daysOfWeek: a.daysOfWeek ?? null,
      }));
      await createRoutineItemsBulk({ items: [...base, ...addons].map((it, idx) => ({ ...it, sortOrder: idx })) });
      localStorage.removeItem("routines365:gettingStarted:dismissed");
      localStorage.removeItem(LS_TEMPLATE);
      localStorage.removeItem(LS_CORE);
      localStorage.removeItem("routines365:onboarding:goal");
      router.replace("/app/today");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  if (!pack) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Add-ons</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  const addons = pack.addons ?? [];

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 rounded-full" style={{ background: "var(--accent-green)", opacity: 0.5 }} />
        <div className="h-1 flex-1 rounded-full" style={{ background: "var(--accent-green)", opacity: 0.5 }} />
        <div className="h-1 flex-1 rounded-full" style={{ background: "var(--accent-green)", opacity: 0.5 }} />
        <div className="h-1 flex-1 rounded-full" style={{ background: "var(--accent-green)" }} />
      </div>

      <header>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Add-ons</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Optional extras. Rename anything later.</p>
        {error && <p className="text-xs mt-1" style={{ color: "var(--accent-red-text)" }}>Error: {error}</p>}
      </header>

      {addons.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No add-ons for this template.</p>
      ) : (
        <section className="space-y-3">
          {addons.map((a) => {
            const active = addonIds.includes(a.id);
            return (
              <button key={a.id} type="button" disabled={busy} onClick={() => toggleAddon(a.id)}
                className="w-full rounded-2xl p-4 text-left disabled:opacity-60 transition-colors"
                style={{
                  border: `1px solid ${active ? "var(--accent-green)" : "var(--border-primary)"}`,
                  background: active ? "var(--accent-green-soft)" : "var(--bg-card)",
                }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{a.emoji ?? ""}</span>
                    <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{a.label}</p>
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: active ? "var(--accent-green)" : "var(--bg-card-hover)",
                      color: active ? "var(--text-inverse)" : "var(--text-secondary)",
                    }}>
                    {active ? "ON" : "OFF"}
                  </span>
                </div>
                <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>Section: {a.section ?? "anytime"}</p>
              </button>
            );
          })}
        </section>
      )}

      <div className="flex items-center justify-between">
        <button type="button" disabled={busy} onClick={() => router.push("/app/onboarding/core")}
          className="btn-secondary text-sm py-3 px-4 disabled:opacity-60">Back</button>
        <button type="button" disabled={busy} onClick={() => void finish()}
          className="btn-primary text-sm py-3 px-4 disabled:opacity-60">{busy ? "Creating…" : "Finish"}</button>
      </div>
    </div>
  );
}
