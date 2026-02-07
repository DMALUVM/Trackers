"use client";

import { useEffect, useState } from "react";
import { getUserSettings, setEnabledModules } from "@/lib/supabaseData";
import { Toast, SubPageHeader, type ToastState } from "@/app/app/_components/ui";
import { hapticLight } from "@/lib/haptics";

const ALL_MODULES = [
  { key: "progress", label: "Progress", desc: "Analytics and trends", emoji: "📈" },
  { key: "rowing", label: "Rowing", desc: "Log erg sessions", emoji: "🚣" },
  { key: "cardio", label: "Cardio", desc: "Walking and running", emoji: "🚶" },
  { key: "recovery", label: "Recovery", desc: "Sauna and cold plunge", emoji: "🔥" },
  { key: "neuro", label: "Neuro", desc: "Neurofeedback tracking", emoji: "🧠" },
  { key: "settings", label: "Settings", desc: "Always enabled", emoji: "⚙️", locked: true },
] as const;

export default function ModulesPage() {
  const [enabled, setEnabled] = useState<Set<string>>(new Set(["progress", "settings"]));
  const [toast, setToast] = useState<ToastState>("idle");

  useEffect(() => {
    void (async () => {
      try {
        const s = await getUserSettings();
        if (s.enabled_modules) setEnabled(new Set([...s.enabled_modules, "settings"]));
      } catch { /* defaults */ }
    })();
  }, []);

  const toggle = async (key: string) => {
    hapticLight();
    const next = new Set(enabled);
    if (next.has(key)) next.delete(key); else next.add(key);
    next.add("settings");
    setEnabled(next);
    setToast("saving");
    try {
      await setEnabledModules([...next]);
      window.dispatchEvent(new Event("routines365:userSettingsChanged"));
      setToast("saved");
      setTimeout(() => setToast("idle"), 1500);
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  return (
    <div className="space-y-5">
      <Toast state={toast} />
      <SubPageHeader title="Modules" subtitle="Choose which tabs appear in the nav bar" backHref="/app/settings" />

      <div className="space-y-2">
        {ALL_MODULES.map((m) => {
          const on = enabled.has(m.key);
          const locked = "locked" in m && m.locked;
          return (
            <button key={m.key} type="button" disabled={locked}
              className="card-interactive px-4 py-3.5 flex items-center justify-between w-full text-left disabled:opacity-50"
              onClick={() => { if (!locked) toggle(m.key); }}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{m.emoji}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.label}</p>
                  <p className="text-xs" style={{ color: "var(--text-faint)" }}>{m.desc}</p>
                </div>
              </div>
              <div className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                style={{
                  background: on ? "var(--accent-green-soft)" : "var(--bg-card-hover)",
                  color: on ? "var(--accent-green-text)" : "var(--text-faint)",
                }}>
                {on ? "ON" : "OFF"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
