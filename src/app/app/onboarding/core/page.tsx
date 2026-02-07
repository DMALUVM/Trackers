"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { templatePacks } from "@/lib/templates";

const LS_KEY = "routines365:onboarding:templateId";
const LS_CORE_KEY = "routines365:onboarding:coreIds";

export default function OnboardingCorePage() {
  const router = useRouter();
  const [templateId, setTemplateId] = useState("");
  const [coreIds, setCoreIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      setTemplateId(localStorage.getItem(LS_KEY) ?? "");
      const raw = localStorage.getItem(LS_CORE_KEY);
      if (raw) setCoreIds(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const pack = useMemo(() => templatePacks.find((p) => p.id === templateId), [templateId]);

  useEffect(() => { if (!templateId) router.replace("/app/onboarding/templates"); }, [router, templateId]);
  useEffect(() => {
    if (!pack || coreIds.length > 0) return;
    setCoreIds(pack.routines.filter((r) => r.defaultCore).map((r) => r.id));
  }, [pack, coreIds.length]);

  const toggle = (id: string) => setCoreIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const saveAndNext = () => {
    try { localStorage.setItem(LS_CORE_KEY, JSON.stringify(coreIds)); } catch { /* ignore */ }
    router.push("/app/onboarding/addons");
  };

  if (!pack) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Choose your CORE</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

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
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Choose your CORE</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>CORE habits drive your Daily Score. Change anytime.</p>
      </header>

      <section className="space-y-3">
        {pack.routines.map((r) => {
          const active = coreIds.includes(r.id);
          return (
            <button key={r.id} type="button" onClick={() => toggle(r.id)}
              className="w-full rounded-2xl p-4 text-left transition-colors"
              style={{
                border: `1px solid ${active ? "var(--accent-green)" : "var(--border-primary)"}`,
                background: active ? "var(--accent-green-soft)" : "var(--bg-card)",
              }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{r.emoji ?? ""}</span>
                  <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{r.label}</p>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    background: active ? "var(--accent-green)" : "var(--bg-card-hover)",
                    color: active ? "var(--text-inverse)" : "var(--text-secondary)",
                  }}>
                  {active ? "CORE" : "OPTIONAL"}
                </span>
              </div>
              <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>Section: {r.section ?? "anytime"}</p>
            </button>
          );
        })}
      </section>

      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>Selected CORE: {coreIds.length}</p>
        <button type="button" disabled={coreIds.length === 0} onClick={saveAndNext}
          className="btn-primary text-sm py-3 px-4 disabled:opacity-60">Next</button>
      </div>
    </div>
  );
}
