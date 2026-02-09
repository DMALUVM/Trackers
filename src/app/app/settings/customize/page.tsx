"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Droplets, BookOpen, Wind, Lightbulb, Heart, Trophy } from "lucide-react";
import Link from "next/link";
import { hapticLight } from "@/lib/haptics";

interface TodaySection {
  id: string;
  label: string;
  description: string;
  icon: typeof Heart;
  color: string;
  lsKey: string;
}

const SECTIONS: TodaySection[] = [
  { id: "quests", label: "Quests", description: "Daily & weekly challenges", icon: Trophy, color: "#f59e0b", lsKey: "routines365:quests:hidden" },
  { id: "water", label: "Water Tracker", description: "Daily hydration tracking", icon: Droplets, color: "#3b82f6", lsKey: "routines365:waterTracker:hidden" },
  { id: "wisdom", label: "Daily Wisdom", description: "Stoic quotes & reflections", icon: BookOpen, color: "#8b5cf6", lsKey: "routines365:dailyWisdom:hidden" },
  { id: "health", label: "Apple Health", description: "Steps, sleep, biometrics", icon: Heart, color: "#ef4444", lsKey: "routines365:healthCard:hidden" },
  { id: "quickActions", label: "Quick Actions", description: "Breathwork, movement, focus shortcuts", icon: Wind, color: "#6366f1", lsKey: "routines365:quickActions:hidden" },
  { id: "smartTips", label: "Smart Tips", description: "Personalized recommendations", icon: Lightbulb, color: "#f59e0b", lsKey: "routines365:smartTips:hidden" },
];

export default function CustomizeTodayPage() {
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const v: Record<string, boolean> = {};
    for (const s of SECTIONS) {
      try {
        v[s.id] = localStorage.getItem(s.lsKey) !== "1";
      } catch {
        v[s.id] = true;
      }
    }
    setVisibility(v);
  }, []);

  const toggle = (section: TodaySection) => {
    hapticLight();
    const newVal = !visibility[section.id];
    setVisibility((prev) => ({ ...prev, [section.id]: newVal }));
    try {
      if (newVal) {
        localStorage.removeItem(section.lsKey);
      } else {
        localStorage.setItem(section.lsKey, "1");
      }
    } catch {}
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/app/settings" className="tap-btn rounded-full p-1.5"
          style={{ background: "var(--bg-card)" }}>
          <ChevronLeft size={20} style={{ color: "var(--text-muted)" }} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Customize Today
          </h1>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            Choose what shows on your Today page
          </p>
        </div>
      </div>

      <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Toggle sections on or off. Your habits and streak will always show.
      </p>

      {/* Toggles */}
      <div className="space-y-2">
        {SECTIONS.map((s) => {
          const on = visibility[s.id] ?? true;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s)}
              className="w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
              style={{
                background: on ? "var(--bg-card)" : "var(--bg-card)",
                border: `1px solid ${on ? "var(--accent-green)" : "var(--border-primary)"}`,
                opacity: on ? 1 : 0.6,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="shrink-0 flex items-center justify-center rounded-xl"
                  style={{ width: 40, height: 40, background: `${s.color}15` }}>
                  <Icon size={20} style={{ color: s.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    {s.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                    {s.description}
                  </p>
                </div>
                {/* Toggle pill */}
                <div
                  className="shrink-0 rounded-full relative transition-all"
                  style={{
                    width: 48,
                    height: 28,
                    background: on ? "var(--accent-green)" : "var(--bg-card-hover)",
                    border: `1px solid ${on ? "var(--accent-green)" : "var(--border-primary)"}`,
                  }}
                >
                  <div
                    className="absolute top-[2px] rounded-full transition-all"
                    style={{
                      width: 22,
                      height: 22,
                      background: "white",
                      left: on ? 22 : 2,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-center pb-4" style={{ color: "var(--text-faint)" }}>
        Changes apply immediately. You can always come back here.
      </p>
    </div>
  );
}
