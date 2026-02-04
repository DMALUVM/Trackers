"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { templatePacks } from "@/lib/templates";

const LS_KEY = "routines365:onboarding:templateId";
const LS_CORE_KEY = "routines365:onboarding:coreIds";

export default function OnboardingCorePage() {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string>("");
  const [coreIds, setCoreIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const tid = localStorage.getItem(LS_KEY) ?? "";
      setTemplateId(tid);
      const raw = localStorage.getItem(LS_CORE_KEY);
      if (raw) setCoreIds(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const pack = useMemo(() => templatePacks.find((p) => p.id === templateId), [templateId]);

  useEffect(() => {
    if (!templateId) {
      router.replace("/app/onboarding/templates");
    }
  }, [router, templateId]);

  useEffect(() => {
    // If no explicit selection yet, seed from defaults.
    if (!pack) return;
    if (coreIds.length > 0) return;
    const defaults = pack.routines.filter((r) => r.defaultCore).map((r) => r.id);
    setCoreIds(defaults);
  }, [pack, coreIds.length]);

  const toggle = (id: string) => {
    setCoreIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const saveAndNext = () => {
    try {
      localStorage.setItem(LS_CORE_KEY, JSON.stringify(coreIds));
    } catch {
      // ignore
    }
    router.push("/app/onboarding/addons");
  };

  if (!pack) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">Choose your CORE</h1>
        <p className="text-sm text-neutral-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Choose your CORE</h1>
        <p className="text-sm text-neutral-400">
          CORE habits drive your Daily Score. You can change this anytime.
        </p>
      </header>

      <section className="space-y-3">
        {pack.routines.map((r) => {
          const active = coreIds.includes(r.id);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => toggle(r.id)}
              className={
                "w-full rounded-2xl border p-4 text-left " +
                (active
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10")
              }
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{r.emoji ?? ""}</span>
                  <p className="text-base font-semibold">{r.label}</p>
                </div>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                    (active ? "bg-emerald-400 text-black" : "bg-white/10 text-neutral-200")
                  }
                >
                  {active ? "CORE" : "OPTIONAL"}
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">Section: {r.section ?? "anytime"}</p>
            </button>
          );
        })}
      </section>

      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">Selected CORE: {coreIds.length}</p>
        <button
          type="button"
          disabled={coreIds.length === 0}
          onClick={saveAndNext}
          className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
        >
          Next
        </button>
      </div>
    </div>
  );
}
