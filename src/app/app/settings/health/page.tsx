"use client";

import { useState, useEffect } from "react";
import { Heart, Footprints, Moon, Flame, Dumbbell, Check, ExternalLink, Zap } from "lucide-react";
import { SubPageHeader } from "@/app/app/_components/ui/SubPageHeader";
import { useHealthKit } from "@/lib/hooks/useHealthKit";
import { hapticMedium, hapticLight } from "@/lib/haptics";
import { loadThresholds, saveThresholds, type AutoCompleteThresholds } from "@/lib/healthAutoComplete";

export default function HealthKitSettingsPage() {
  const { available, authorized, requestAuth, steps, sleep, summary } = useHealthKit();
  const [connecting, setConnecting] = useState(false);
  const [thresholds, setThresholds] = useState<AutoCompleteThresholds>(loadThresholds());

  const updateThreshold = (key: keyof AutoCompleteThresholds, value: number | boolean) => {
    hapticLight();
    const next = { ...thresholds, [key]: value };
    setThresholds(next);
    saveThresholds(next);
  };

  const handleConnect = async () => {
    hapticMedium();
    setConnecting(true);
    await requestAuth();
    setConnecting(false);
  };

  return (
    <div className="space-y-6">
      <SubPageHeader title="Apple Health" subtitle="Auto-track from your devices" />

      {!available ? (
        /* Not running in native app */
        <div className="rounded-2xl p-5 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <Heart size={32} className="mx-auto mb-3" style={{ color: "var(--text-faint)" }} />
          <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Apple Health requires the native app
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Install Routines365 from the App Store to connect Apple Health and automatically track steps, sleep, and workouts.
          </p>
        </div>
      ) : !authorized ? (
        /* Native but not authorized */
        <div className="space-y-4">
          <div className="rounded-2xl p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
            <div className="text-center space-y-3">
              <div className="mx-auto flex items-center justify-center rounded-full"
                style={{ width: 64, height: 64, background: "rgba(239,68,68,0.1)" }}>
                <Heart size={28} style={{ color: "#ef4444" }} />
              </div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Connect Apple Health
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Let Routines365 read your health data to automatically fill in steps, sleep duration, workouts, and calories.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {[
                { icon: Footprints, color: "#3b82f6", label: "Step count", desc: "Daily steps from your iPhone & Apple Watch" },
                { icon: Moon, color: "#8b5cf6", label: "Sleep analysis", desc: "Bedtime, wake time, and duration" },
                { icon: Dumbbell, color: "#10b981", label: "Workouts", desc: "Type, duration, and calories burned" },
                { icon: Flame, color: "#f97316", label: "Active calories", desc: "Energy burned throughout the day" },
              ].map(({ icon: Icon, color, label, desc }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: "var(--bg-card-hover)" }}>
                  <div className="shrink-0 flex items-center justify-center rounded-lg"
                    style={{ width: 36, height: 36, background: `${color}15` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</p>
                    <p className="text-xs" style={{ color: "var(--text-faint)" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={handleConnect} disabled={connecting}
              className="mt-5 w-full rounded-xl py-3.5 text-base font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>
              {connecting ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 animate-spin"
                    style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "black" }} />
                  Connecting…
                </>
              ) : (
                <>
                  <Heart size={16} />
                  Connect Apple Health
                </>
              )}
            </button>

            <p className="mt-3 text-[10px] text-center" style={{ color: "var(--text-faint)" }}>
              We only read data — we never write to Apple Health. Your data stays on your device.
            </p>
          </div>
        </div>
      ) : (
        /* Authorized — show status */
        <div className="space-y-4">
          <div className="rounded-2xl p-4"
            style={{ background: "var(--accent-green-soft)", border: "1px solid var(--accent-green)" }}>
            <div className="flex items-center gap-3">
              <div className="shrink-0 flex items-center justify-center rounded-full"
                style={{ width: 40, height: 40, background: "var(--accent-green)" }}>
                <Check size={20} style={{ color: "white" }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--accent-green-text)" }}>
                  Apple Health connected
                </p>
                <p className="text-xs" style={{ color: "var(--accent-green-text)", opacity: 0.7 }}>
                  Data syncs automatically when you open the app
                </p>
              </div>
            </div>
          </div>

          {/* Current data preview */}
          <div className="rounded-2xl p-4 space-y-3"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
              Today&apos;s data
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ background: "var(--bg-card-hover)" }}>
                <Footprints size={16} style={{ color: "#3b82f6" }} />
                <p className="mt-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {steps.toLocaleString()}
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>steps</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: "var(--bg-card-hover)" }}>
                <Moon size={16} style={{ color: "#8b5cf6" }} />
                <p className="mt-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {sleep ? `${(sleep.totalMinutes / 60).toFixed(1)}h` : "—"}
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>sleep</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: "var(--bg-card-hover)" }}>
                <Flame size={16} style={{ color: "#f97316" }} />
                <p className="mt-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {summary?.activeCalories ?? 0}
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>active cal</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: "var(--bg-card-hover)" }}>
                <Dumbbell size={16} style={{ color: "#10b981" }} />
                <p className="mt-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {summary?.workouts?.length ?? 0}
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>workouts</p>
              </div>
            </div>
          </div>

          {/* Manage in iOS Settings */}
          <button type="button"
            onClick={() => {
              hapticMedium();
              // Deep link to iOS Health app settings (best we can do)
              window.open("x-apple-health://", "_blank");
            }}
            className="w-full rounded-xl p-3 flex items-center justify-between"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              Manage permissions in Health app
            </span>
            <ExternalLink size={14} style={{ color: "var(--text-faint)" }} />
          </button>

          {/* Smart Auto-Complete */}
          <div className="rounded-2xl p-4 space-y-4"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={16} style={{ color: "#f59e0b" }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                  Smart auto-complete
                </span>
              </div>
              <button type="button"
                onClick={() => updateThreshold("enabled", !thresholds.enabled)}
                className="relative rounded-full transition-all"
                style={{
                  width: 44, height: 24,
                  background: thresholds.enabled ? "var(--accent-green)" : "var(--bg-card-hover)",
                  border: `1px solid ${thresholds.enabled ? "var(--accent-green)" : "var(--border-primary)"}`,
                }}>
                <div className="absolute top-0.5 rounded-full bg-white transition-all"
                  style={{ width: 20, height: 20, left: thresholds.enabled ? 21 : 2 }} />
              </button>
            </div>

            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Automatically check off habits when Apple Health data meets your goals. Habits are matched by keywords in their names.
            </p>

            {thresholds.enabled && (
              <div className="space-y-3 pt-1">
                {([
                  { key: "steps" as const, icon: Footprints, color: "#3b82f6", label: "Step goal", value: thresholds.steps, unit: "steps", options: [5000, 6000, 7000, 8000, 10000, 12000, 15000] },
                  { key: "sleepHours" as const, icon: Moon, color: "#8b5cf6", label: "Sleep goal", value: thresholds.sleepHours, unit: "hours", options: [6, 6.5, 7, 7.5, 8, 8.5, 9] },
                  { key: "workoutMinutes" as const, icon: Dumbbell, color: "#10b981", label: "Workout min", value: thresholds.workoutMinutes, unit: "min", options: [10, 15, 20, 30, 45, 60] },
                  { key: "caloriesBurned" as const, icon: Flame, color: "#f97316", label: "Calorie goal", value: thresholds.caloriesBurned, unit: "cal", options: [150, 200, 250, 300, 400, 500, 600] },
                ]).map(({ key, icon: Icon, color, label, value, unit, options }) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className="shrink-0 flex items-center justify-center rounded-lg"
                      style={{ width: 32, height: 32, background: `${color}15` }}>
                      <Icon size={15} style={{ color }} />
                    </div>
                    <span className="flex-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {label}
                    </span>
                    <select
                      value={value}
                      onChange={(e) => updateThreshold(key, Number(e.target.value))}
                      className="rounded-lg px-2 py-1.5 text-sm font-semibold text-right"
                      style={{
                        background: "var(--bg-card-hover)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-primary)",
                        appearance: "none",
                        WebkitAppearance: "none",
                        paddingRight: "0.75rem",
                      }}>
                      {options.map((o) => (
                        <option key={o} value={o}>
                          {o.toLocaleString()} {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                <p className="text-[10px] pt-1" style={{ color: "var(--text-faint)" }}>
                  Matching keywords: &quot;walk&quot;, &quot;steps&quot;, &quot;sleep&quot;, &quot;workout&quot;, &quot;gym&quot;, &quot;exercise&quot;, &quot;calories&quot;, &quot;burn&quot;
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
