"use client";

import { useEffect, useState } from "react";
import { getUserSettings, setEnabledModules } from "@/lib/supabaseData";
import { Toast, SubPageHeader, type ToastState } from "@/app/app/_components/ui";
import { hapticLight } from "@/lib/haptics";

const LS_WATER_HIDDEN = "routines365:waterTracker:hidden";
const LS_WISDOM_HIDDEN = "routines365:dailyWisdom:hidden";
const LS_HEALTH_HIDDEN = "routines365:healthCard:hidden";
const LS_QUESTS_HIDDEN = "routines365:quests:hidden";

function WaterTrackerToggle() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try { setHidden(localStorage.getItem(LS_WATER_HIDDEN) === "1"); } catch {}
  }, []);

  const toggle = () => {
    const next = !hidden;
    setHidden(next);
    localStorage.setItem(LS_WATER_HIDDEN, next ? "1" : "0");
    hapticLight();
  };

  return (
    <section>
      <p className="text-[10px] font-bold tracking-wider uppercase mb-2 px-1" style={{ color: "var(--text-faint)" }}>
        Today page widgets
      </p>
      <button type="button"
        className="card-interactive px-4 py-3.5 flex items-center justify-between w-full text-left"
        onClick={toggle}>
        <div className="flex items-center gap-3">
          <span className="text-lg">💧</span>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Water Tracker</p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>Track daily water intake on Today page</p>
          </div>
        </div>
        <div className="rounded-full px-2.5 py-1 text-[10px] font-semibold shrink-0"
          style={{
            background: !hidden ? "var(--accent-green-soft)" : "var(--bg-card-hover)",
            color: !hidden ? "var(--accent-green-text)" : "var(--text-faint)",
          }}>
          {!hidden ? "ON" : "OFF"}
        </div>
      </button>
    </section>
  );
}

function DailyWisdomToggle() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try { setHidden(localStorage.getItem(LS_WISDOM_HIDDEN) === "1"); } catch {}
  }, []);

  const toggle = () => {
    const next = !hidden;
    setHidden(next);
    localStorage.setItem(LS_WISDOM_HIDDEN, next ? "1" : "0");
    hapticLight();
  };

  return (
    <button type="button"
      className="card-interactive px-4 py-3.5 flex items-center justify-between w-full text-left"
      onClick={toggle}>
      <div className="flex items-center gap-3">
        <span className="text-lg">🏛️</span>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Daily Wisdom</p>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>Stoic philosophy quote each day</p>
        </div>
      </div>
      <div className="rounded-full px-2.5 py-1 text-[10px] font-semibold shrink-0"
        style={{
          background: !hidden ? "var(--accent-green-soft)" : "var(--bg-card-hover)",
          color: !hidden ? "var(--accent-green-text)" : "var(--text-faint)",
        }}>
        {!hidden ? "ON" : "OFF"}
      </div>
    </button>
  );
}

function HealthCardToggle() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try { setHidden(localStorage.getItem(LS_HEALTH_HIDDEN) === "1"); } catch {}
  }, []);

  const toggle = () => {
    const next = !hidden;
    setHidden(next);
    localStorage.setItem(LS_HEALTH_HIDDEN, next ? "1" : "0");
    hapticLight();
  };

  return (
    <button type="button"
      className="card-interactive px-4 py-3.5 flex items-center justify-between w-full text-left"
      onClick={toggle}>
      <div className="flex items-center gap-3">
        <span className="text-lg">❤️</span>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Apple Health Card</p>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>Steps, sleep, calories, workouts summary</p>
        </div>
      </div>
      <div className="rounded-full px-2.5 py-1 text-[10px] font-semibold shrink-0"
        style={{
          background: !hidden ? "var(--accent-green-soft)" : "var(--bg-card-hover)",
          color: !hidden ? "var(--accent-green-text)" : "var(--text-faint)",
        }}>
        {!hidden ? "ON" : "OFF"}
      </div>
    </button>
  );
}

function QuestsToggle() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try { setHidden(localStorage.getItem(LS_QUESTS_HIDDEN) === "1"); } catch {}
  }, []);

  const toggle = () => {
    const next = !hidden;
    setHidden(next);
    localStorage.setItem(LS_QUESTS_HIDDEN, next ? "1" : "0");
    hapticLight();
  };

  return (
    <button type="button"
      className="card-interactive px-4 py-3.5 flex items-center justify-between w-full text-left"
      onClick={toggle}>
      <div className="flex items-center gap-3">
        <span className="text-lg">⚔️</span>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Quests</p>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>Weekly challenges and bonus goals</p>
        </div>
      </div>
      <div className="rounded-full px-2.5 py-1 text-[10px] font-semibold shrink-0"
        style={{
          background: !hidden ? "var(--accent-green-soft)" : "var(--bg-card-hover)",
          color: !hidden ? "var(--accent-green-text)" : "var(--text-faint)",
        }}>
        {!hidden ? "ON" : "OFF"}
      </div>
    </button>
  );
}

type Module = {
  key: string;
  label: string;
  desc: string;
  emoji: string;
};

type ModuleGroup = {
  title: string;
  items: Module[];
};

const MODULE_GROUPS: ModuleGroup[] = [
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
];

// Home and Progress are always in the nav bar.
// Settings is accessible via the gear icon in the header.
// User can pick up to 4 modules for the remaining nav slots.
const MAX_PICKS = 4;

// These keys are always enabled but don't count toward the user's picks
const ALWAYS_ON = new Set(["progress", "settings"]);

export default function ModulesPage() {
  const [enabled, setEnabled] = useState<Set<string>>(new Set(["progress", "settings"]));
  const [toast, setToast] = useState<ToastState>("idle");

  useEffect(() => {
    void (async () => {
      try {
        const s = await getUserSettings();
        if (s.enabled_modules) setEnabled(new Set(s.enabled_modules));
      } catch { /* defaults */ }
    })();
  }, []);

  // Count only user-chosen modules (not always-on ones)
  const userPickCount = [...enabled].filter((k) => !ALWAYS_ON.has(k)).length;

  const toggle = async (key: string) => {
    hapticLight();
    const next = new Set(enabled);
    const isOn = next.has(key);

    if (!isOn && userPickCount >= MAX_PICKS) {
      setToast("error");
      setTimeout(() => setToast("idle"), 2000);
      return;
    }

    if (isOn) next.delete(key); else next.add(key);
    // Keep always-on modules
    for (const k of ALWAYS_ON) next.add(k);
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
      <SubPageHeader title="Modules" subtitle="Add extra tracking features to your app" backHref="/app/settings" />

      <div className="rounded-2xl px-4 py-3" style={{ background: "var(--accent-green-soft)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
        <p className="text-sm font-bold mb-1" style={{ color: "var(--accent-green-text)" }}>💡 Habits check it off. Modules log the details.</p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Your habits on the Today screen track <em>whether</em> you did something. Modules give you a dedicated page to log <em>how much</em> — like hours slept, meters rowed, or glasses of water. Each module gets its own tab in the nav bar.
        </p>
      </div>

      <div className="rounded-xl px-3 py-2.5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Today</span> and{" "}
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Progress</span>{" "}
          are always in the nav bar. Settings is in the ⚙️ icon. Pick up to{" "}
          <span className="font-semibold" style={{ color: userPickCount >= MAX_PICKS ? "var(--accent-yellow)" : "var(--accent-green-text)" }}>
            {MAX_PICKS} more
          </span>{" "}
          modules for the remaining nav slots.
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          {Array.from({ length: MAX_PICKS }).map((_, i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full transition-colors"
              style={{ background: i < userPickCount ? "var(--accent-green)" : "var(--bg-card-hover)" }} />
          ))}
        </div>
      </div>

      {MODULE_GROUPS.map((group) => (
        <section key={group.title}>
          <p className="text-[10px] font-bold tracking-wider uppercase mb-2 px-1" style={{ color: "var(--text-faint)" }}>
            {group.title}
          </p>
          <div className="space-y-1.5">
            {group.items.map((m) => {
              const on = enabled.has(m.key);
              const atLimit = !on && userPickCount >= MAX_PICKS;
              return (
                <button key={m.key} type="button"
                  className="card-interactive px-4 py-3.5 flex items-center justify-between w-full text-left"
                  style={{ opacity: atLimit && !on ? 0.45 : undefined }}
                  onClick={() => toggle(m.key)}>
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
                    {on ? "ON" : "OFF"}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {/* ── TODAY PAGE WIDGETS ── */}
      <WaterTrackerToggle />
      <DailyWisdomToggle />
      <HealthCardToggle />
      <QuestsToggle />
    </div>
  );
}
