"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { templatePacks } from "@/lib/templates";
import { createRoutineItemsBulk, listRoutineItems } from "@/lib/supabaseData";

const LS_TEMPLATE = "routines365:onboarding:templateId";
const LS_CORE = "routines365:onboarding:coreIds";

export default function OnboardingAddonsPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");

  const [templateId, setTemplateId] = useState<string>("");
  const [coreIds, setCoreIds] = useState<string[]>([]);
  const [addonIds, setAddonIds] = useState<string[]>([]);

  useEffect(() => {
    const run = async () => {
      const items = await listRoutineItems();
      if (items.length > 0) {
        router.replace("/app/today");
      }
    };
    void run();
  }, [router]);

  useEffect(() => {
    try {
      const tid = localStorage.getItem(LS_TEMPLATE) ?? "";
      setTemplateId(tid);
      const rawCore = localStorage.getItem(LS_CORE);
      setCoreIds(rawCore ? JSON.parse(rawCore) : []);
    } catch {
      // ignore
    }
  }, []);

  const pack = useMemo(() => templatePacks.find((p) => p.id === templateId), [templateId]);

  useEffect(() => {
    if (!templateId) router.replace("/app/onboarding/templates");
  }, [router, templateId]);

  useEffect(() => {
    if (!pack?.addons) return;
    // default selections
    const defaults = pack.addons.filter((a) => a.defaultOn).map((a) => a.id);
    setAddonIds(defaults);
  }, [pack]);

  const toggleAddon = (id: string) => {
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const finish = async () => {
    if (!pack) return;
    if (coreIds.length === 0) {
      router.replace("/app/onboarding/core");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const base = pack.routines.map((r) => ({
        label: r.label,
        emoji: r.emoji ?? null,
        section: r.section ?? "anytime",
        isNonNegotiable: coreIds.includes(r.id),
        daysOfWeek: r.daysOfWeek ?? null,
      }));

      const addons = (pack.addons ?? [])
        .filter((a) => addonIds.includes(a.id))
        .map((a) => ({
          label: a.label,
          emoji: a.emoji ?? null,
          section: a.section ?? "anytime",
          isNonNegotiable: false,
          daysOfWeek: a.daysOfWeek ?? null,
        }));

      const items = [...base, ...addons];

      await createRoutineItemsBulk({
        items: items.map((it, idx) => ({ ...it, sortOrder: idx })),
      });

      localStorage.removeItem("routines365:gettingStarted:dismissed");
      localStorage.removeItem(LS_TEMPLATE);
      localStorage.removeItem(LS_CORE);

      router.replace("/app/today");
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!pack) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">Add-ons</h1>
        <p className="text-sm text-neutral-400">Loading…</p>
      </div>
    );
  }

  const addons = pack.addons ?? [];

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Add-ons</h1>
        <p className="text-sm text-neutral-400">Optional extras. You can rename anything later.</p>
        {error ? <p className="text-xs text-rose-300">Error: {error}</p> : null}
      </header>

      {addons.length === 0 ? (
        <p className="text-sm text-neutral-400">No add-ons for this template.</p>
      ) : (
        <section className="space-y-3">
          {addons.map((a) => {
            const active = addonIds.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                disabled={busy}
                onClick={() => toggleAddon(a.id)}
                className={
                  "w-full rounded-2xl border p-4 text-left disabled:opacity-60 " +
                  (active
                    ? "border-sky-500/30 bg-sky-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10")
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{a.emoji ?? ""}</span>
                    <p className="text-base font-semibold">{a.label}</p>
                  </div>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                      (active ? "bg-sky-400 text-black" : "bg-white/10 text-neutral-200")
                    }
                  >
                    {active ? "ON" : "OFF"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-500">Section: {a.section ?? "anytime"}</p>
              </button>
            );
          })}
        </section>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={busy}
          onClick={() => router.push("/app/onboarding/core")}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60"
        >
          Back
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void finish()}
          className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
        >
          {busy ? "Creating…" : "Finish"}
        </button>
      </div>
    </div>
  );
}
