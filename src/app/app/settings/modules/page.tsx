"use client";

import { useEffect, useState } from "react";
import { getUserSettings, setEnabledModules } from "@/lib/supabaseData";

const ALL_MODULES: Array<{ key: string; label: string; desc: string }> = [
  { key: "progress", label: "Progress", desc: "Calendar, goals, totals." },
  { key: "rowing", label: "Rowing", desc: "Log meters and review totals." },
  { key: "cardio", label: "Cardio", desc: "Walking steps + running miles." },
  { key: "recovery", label: "Recovery", desc: "Sauna + cold plunge sessions." },
  { key: "neuro", label: "Neuro", desc: "Optional module." },
  { key: "settings", label: "Settings", desc: "Routines, modules, backups." },
];

export default function ModulesSettingsPage() {
  const [enabled, setEnabled] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      const s = await getUserSettings();
      setEnabled(s.enabled_modules ?? []);
    };
    void run();
  }, []);

  const toggle = async (key: string) => {
    let next = enabled.includes(key)
      ? enabled.filter((k) => k !== key)
      : [...enabled, key];

    // Guardrail: always keep settings enabled
    if (!next.includes("settings")) next = [...next, "settings"];

    setEnabled(next);
    setStatus("Saving...");
    try {
      await setEnabledModules(next);
      setStatus("Saved.");
      setTimeout(() => setStatus(""), 1000);
    } catch (e: any) {
      setStatus(`Save failed: ${e?.message ?? String(e)}`);
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Modules</h1>
        <p className="text-sm text-neutral-400">
          Choose which tabs appear in the bottom nav. Routines is always on.
        </p>
        {status ? <p className="text-xs text-neutral-400">{status}</p> : null}
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="space-y-2">
          {ALL_MODULES.map((m) => {
            const on = enabled.includes(m.key);
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => toggle(m.key)}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm hover:bg-white/10"
              >
                <div>
                  <p className="font-medium text-neutral-100">{m.label}</p>
                  <p className="text-xs text-neutral-400">{m.desc}</p>
                </div>
                <span
                  className={
                    on
                      ? "rounded-full bg-emerald-500/20 px-2 py-1 text-[11px] font-semibold text-emerald-200"
                      : "rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-neutral-300"
                  }
                >
                  {on ? "ON" : "OFF"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-neutral-500">
        Note: New users will not get Neuro by default.
      </p>
    </div>
  );
}
