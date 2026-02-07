"use client";

import { useEffect, useState } from "react";
import { getUserSettings, setEnabledModules } from "@/lib/supabaseData";
import { Toast, SubPageHeader, type ToastState } from "@/app/app/_components/ui";
import { hapticLight } from "@/lib/haptics";

type Module = {
  key: string;
  label: string;
  desc: string;
  emoji: string;
  locked?: boolean;
};

type ModuleGroup = {
  title: string;
  items: Module[];
};

const MODULE_GROUPS: ModuleGroup[] = [
  {
    title: "Core",
    items: [
      { key: "progress", label: "Progress", desc: "Calendar, streaks, and analytics", emoji: "📈" },
    ],
  },
  {
    title: "Activity tracking",
    items: [
      { key: "fitness", label: "Fitness", desc: "Log any workout — weights, classes, sports", emoji: "💪" },
      { key: "cardio", label: "Cardio", desc: "Walking and running with step counts", emoji: "🚶" },
      { key: "rowing", label: "Rowing", desc: "Log erg sessions in meters", emoji: "🚣" },
      { key: "recovery", label: "Recovery", desc: "Sauna, cold plunge, and rest", emoji: "🔥" },
    ],
  },
  {
    title: "Wellness",
    items: [
      { key: "sleep", label: "Sleep", desc: "Track hours slept each night", emoji: "😴" },
      { key: "hydration", label: "Hydration", desc: "Daily water intake", emoji: "💧" },
      { key: "supplements", label: "Supplements", desc: "Daily supplement and medication stack", emoji: "💊" },
      { key: "mindfulness", label: "Mindfulness", desc: "Meditation and breathwork sessions", emoji: "🧘" },
    ],
  },
  {
    title: "Reflection",
    items: [
      { key: "journal", label: "Journal", desc: "Daily notes, wins, and reflections", emoji: "📓" },
    ],
  },
  {
    title: "Specialized",
    items: [
      { key: "neuro", label: "Neuro", desc: "Neurofeedback session tracking", emoji: "🧠" },
    ],
  },
  {
    title: "System",
    items: [
      { key: "settings", label: "Settings", desc: "Always enabled", emoji: "⚙️", locked: true },
    ],
  },
];

const MAX_TABS = 3;

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

  const userChosenCount = [...enabled].filter((k) => k !== "settings").length;

  const toggle = async (key: string) => {
    hapticLight();
    const next = new Set(enabled);
    const isOn = next.has(key);

    if (!isOn && userChosenCount >= MAX_TABS) {
      setToast("error");
      setTimeout(() => setToast("idle"), 2000);
      return;
    }

    if (isOn) next.delete(key); else next.add(key);
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

      <p className="text-xs px-1" style={{ color: "var(--text-faint)" }}>
        Pick up to {MAX_TABS} modules. Today, Routines, and Settings are always shown.{" "}
        <span className="font-semibold" style={{ color: userChosenCount >= MAX_TABS ? "var(--accent-yellow)" : "var(--text-muted)" }}>
          {userChosenCount}/{MAX_TABS} selected
        </span>
      </p>

      {MODULE_GROUPS.map((group) => (
        <section key={group.title}>
          <p className="text-[10px] font-bold tracking-wider uppercase mb-2 px-1" style={{ color: "var(--text-faint)" }}>
            {group.title}
          </p>
          <div className="space-y-1.5">
            {group.items.map((m) => {
              const on = enabled.has(m.key);
              const locked = !!m.locked;
              const atLimit = !on && userChosenCount >= MAX_TABS;
              return (
                <button key={m.key} type="button" disabled={locked}
                  className="card-interactive px-4 py-3.5 flex items-center justify-between w-full text-left disabled:opacity-40"
                  style={{ opacity: atLimit && !on ? 0.45 : undefined }}
                  onClick={() => { if (!locked) toggle(m.key); }}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{m.emoji}</span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.label}</p>
                      <p className="text-xs" style={{ color: "var(--text-faint)" }}>{m.desc}</p>
                    </div>
                  </div>
                  <div className="rounded-full px-2.5 py-1 text-[10px] font-semibold shrink-0"
                    style={{
                      background: on ? "var(--accent-green-soft)" : "var(--bg-card-hover)",
                      color: on ? "var(--accent-green-text)" : "var(--text-faint)",
                    }}>
                    {locked ? "ALWAYS" : on ? "ON" : "OFF"}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
