"use client";

import { useState, useEffect } from "react";
import { Heart, Footprints, Moon, Flame, Dumbbell, Settings2, Activity, Wind, Droplets, Lock, RefreshCw } from "lucide-react";
import { useHealthKit } from "@/lib/hooks/useHealthKit";
import { usePremium } from "@/lib/premium";
import { hapticLight } from "@/lib/haptics";
import { getDaySummary } from "@/lib/healthKit";

const LS_KEY = "routines365:healthcard:metrics";
type MetricId = "steps" | "sleep" | "sleep_stages" | "calories" | "workouts" | "hrv" | "rhr" | "spo2" | "respiratory";
const ALL_METRICS: { id: MetricId; label: string; premium?: boolean }[] = [
  { id: "steps", label: "Steps" },
  { id: "sleep", label: "Sleep" },
  { id: "sleep_stages", label: "Sleep Stages", premium: true },
  { id: "calories", label: "Calories" },
  { id: "workouts", label: "Workouts" },
  { id: "hrv", label: "HRV", premium: true },
  { id: "rhr", label: "Heart Rate", premium: true },
  { id: "spo2", label: "SpO2", premium: true },
  { id: "respiratory", label: "Breathing", premium: true },
];
const DEFAULT_METRICS: MetricId[] = ["steps", "sleep", "calories", "workouts"];

function getVisibleMetrics(): MetricId[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as MetricId[];
  } catch {}
  return DEFAULT_METRICS;
}
function saveVisibleMetrics(ids: MetricId[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(ids)); } catch {}
}

/**
 * Compact Apple Health summary card shown on Today page.
 * Only renders when running in native app with HealthKit authorized.
 * Shows: steps, sleep, calories, workouts + premium biometrics.
 */
export function HealthCard() {
  const { available, authorized, requestAuth, steps, sleep, summary, refresh, loading } = useHealthKit();
  const { isPremium } = usePremium();
  const [visible, setVisible] = useState<MetricId[]>(DEFAULT_METRICS);
  const [showSettings, setShowSettings] = useState(false);
  const [bio, setBio] = useState<{ hrv?: number; restingHeartRate?: number; spo2?: number; respiratory?: number } | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { setVisible(getVisibleMetrics()); }, []);

  // Fetch biometric data — use both getDaySummary and getBiometricSummary for best coverage
  useEffect(() => {
    if (!available || !authorized || !isPremium) return;
    const hasBioMetric = visible.some(id => ["hrv", "rhr", "spo2", "respiratory"].includes(id));
    if (!hasBioMetric) return;
    void (async () => {
      try {
        const { getBiometricSummary } = await import("@/lib/healthKit");
        // Use 2 days for biometric summary to catch overnight data from wearables
        const [s, bioData] = await Promise.all([
          getDaySummary(),
          getBiometricSummary(2),
        ]);
        const spo2Val = bioData?.bloodOxygen?.[0]?.value;
        const rrVal = bioData?.respiratoryRate?.[0]?.value;
        // Use getDaySummary values first, fall back to biometric summary
        const hrvFromBio = bioData?.hrv?.[0]?.value;
        const rhrFromBio = bioData?.restingHeartRate?.[0]?.value;
        setBio({
          hrv: s?.hrv ?? hrvFromBio,
          restingHeartRate: s?.restingHeartRate ?? rhrFromBio,
          spo2: spo2Val,
          respiratory: rrVal,
        });
      } catch { /* ignore */ }
    })();
  }, [available, authorized, isPremium, visible, refreshCount]);

  const handleRefresh = async () => {
    setSyncing(true);
    hapticLight();
    await refresh();
    setRefreshCount(c => c + 1); // triggers bio re-fetch too
    setTimeout(() => setSyncing(false), 600);
  };

  // Don't show anything on web
  if (!available) return null;

  // Show connect prompt if not authorized
  if (!authorized) {
    return (
      <button
        type="button"
        onClick={() => { hapticLight(); void requestAuth(); }}
        className="w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
        style={{
          background: "var(--bg-card)",
          border: "2px dashed var(--border-primary)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="shrink-0 flex items-center justify-center rounded-xl"
            style={{ width: 44, height: 44, background: "rgba(239,68,68,0.1)" }}>
            <Heart size={22} style={{ color: "#ef4444" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Connect Apple Health
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Auto-track steps, sleep, and workouts
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>
            Connect
          </span>
        </div>
      </button>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl p-4 animate-pulse"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
        <div className="h-16" />
      </div>
    );
  }

  const sleepHours = sleep ? (sleep.totalMinutes / 60).toFixed(1) : null;
  const workoutCount = summary?.workouts?.length ?? 0;
  const calories = summary?.activeCalories ?? 0;

  const toggleMetric = (id: MetricId) => {
    const metric = ALL_METRICS.find(m => m.id === id);
    if (metric?.premium && !isPremium) {
      hapticLight();
      window.location.href = "/app/settings/premium";
      return;
    }
    hapticLight();
    // When toggling ON a biometric metric, re-request auth to ensure
    // new HealthKit types (HRV, RHR, SpO2, respiratory) are authorized
    if (metric?.premium && !visible.includes(id)) {
      void requestAuth();
    }
    setVisible((prev) => {
      const next = prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id];
      if (next.length === 0) return prev; // must have at least 1
      saveVisibleMetrics(next);
      return next;
    });
  };

  const hrvValue = bio?.hrv;
  const rhrValue = bio?.restingHeartRate;
  const spo2Value = bio?.spo2;
  const respiratoryValue = bio?.respiratory;

  const metricData: Record<MetricId, { icon: typeof Heart; color: string; bg: string; value: string; sub: string }> = {
    steps: { icon: Footprints, color: "#3b82f6", bg: "rgba(59,130,246,0.1)", value: steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : String(steps), sub: "steps" },
    sleep: { icon: Moon, color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", value: sleepHours ?? "—", sub: sleepHours ? "hrs sleep" : "no data" },
    sleep_stages: { icon: Moon, color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", value: "", sub: "" },
    calories: { icon: Flame, color: "#f97316", bg: "rgba(249,115,22,0.1)", value: calories > 0 ? String(calories) : "—", sub: calories > 0 ? "cal burned" : "no data" },
    workouts: { icon: Dumbbell, color: "#10b981", bg: "rgba(16,185,129,0.1)", value: workoutCount > 0 ? String(workoutCount) : "—", sub: workoutCount === 1 ? "workout" : workoutCount > 1 ? "workouts" : "none today" },
    hrv: { icon: Activity, color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", value: hrvValue ? String(Math.round(hrvValue)) : "—", sub: hrvValue ? "ms HRV" : "no data" },
    rhr: { icon: Heart, color: "#ef4444", bg: "rgba(239,68,68,0.1)", value: rhrValue ? String(Math.round(rhrValue)) : "—", sub: rhrValue ? "bpm resting" : "no data" },
    spo2: { icon: Droplets, color: "#3b82f6", bg: "rgba(59,130,246,0.1)", value: spo2Value ? `${Math.round(spo2Value)}%` : "—", sub: spo2Value ? "blood oxygen" : "no data" },
    respiratory: { icon: Wind, color: "#06b6d4", bg: "rgba(6,182,212,0.1)", value: respiratoryValue ? String(Math.round(respiratoryValue)) : "—", sub: respiratoryValue ? "br/min" : "no data" },
  };

  return (
    <div className="rounded-2xl p-4"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Heart size={14} style={{ color: "#ef4444" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
            Apple Health
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={handleRefresh}
            className="rounded-full p-1.5"
            style={{ background: "transparent" }}
            aria-label="Refresh health data">
            <RefreshCw size={13} style={{ color: "var(--text-faint)", transition: "transform 0.3s", transform: syncing ? "rotate(180deg)" : "none" }} />
          </button>
          <button type="button" onClick={() => { hapticLight(); setShowSettings(!showSettings); }}
            className="rounded-full p-1.5" style={{ background: showSettings ? "var(--bg-card-hover)" : "transparent" }}>
            <Settings2 size={14} style={{ color: "var(--text-faint)" }} />
          </button>
        </div>
      </div>

      {/* Customization toggles */}
      {showSettings && (
        <div className="flex flex-wrap gap-2 mb-3 pb-3" style={{ borderBottom: "1px solid var(--border-primary)" }}>
          {ALL_METRICS.map(({ id, label, premium }) => (
            <button key={id} type="button" onClick={() => toggleMetric(id)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1"
              style={{
                background: visible.includes(id) ? "var(--accent-green-soft)" : "var(--bg-card-hover)",
                color: visible.includes(id) ? "var(--accent-green-text)" : "var(--text-faint)",
                border: visible.includes(id) ? "1px solid var(--accent-green)" : "1px solid transparent",
              }}>
              {label}
              {premium && !isPremium && <Lock size={10} />}
            </button>
          ))}
        </div>
      )}

      {/* Stats grid — only show visible metrics */}
      <div className="grid grid-cols-2 gap-3">
        {visible.map((id) => {
          if (id === "sleep_stages") return null; // rendered separately below
          const m = metricData[id];
          if (!m) return null;
          const Icon = m.icon;
          return (
            <div key={id} className="flex items-center gap-2.5">
              <div className="shrink-0 flex items-center justify-center rounded-lg"
                style={{ width: 36, height: 36, background: m.bg }}>
                <Icon size={18} style={{ color: m.color }} />
              </div>
              <div>
                <p className="text-lg font-bold leading-none" style={{ color: "var(--text-primary)" }}>
                  {m.value}
                </p>
                <p className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>{m.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sleep stage breakdown — toggleable via settings */}
      {visible.includes("sleep_stages") && sleep &&
       (sleep.deepMinutes || sleep.coreMinutes || sleep.remMinutes) && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-primary)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Moon size={12} style={{ color: "#8b5cf6" }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
              Sleep stages
            </span>
          </div>
          <div className="flex gap-1 mb-2" style={{ height: 8, borderRadius: 4, overflow: "hidden" }}>
            {(() => {
              const deep = sleep.deepMinutes ?? 0;
              const core = sleep.coreMinutes ?? 0;
              const rem = sleep.remMinutes ?? 0;
              const total = deep + core + rem || 1;
              return (
                <>
                  <div style={{ flex: deep / total, background: "#6366f1", borderRadius: 4 }} />
                  <div style={{ flex: core / total, background: "#8b5cf6", borderRadius: 4 }} />
                  <div style={{ flex: rem / total, background: "#c084fc", borderRadius: 4 }} />
                </>
              );
            })()}
          </div>
          <div className="flex justify-between text-[10px]">
            <span style={{ color: "#8b8bf6" }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 2, background: "#6366f1", marginRight: 3 }} />
              Deep {sleep.deepMinutes ? `${Math.round(sleep.deepMinutes)}m` : "—"}
            </span>
            <span style={{ color: "#a78bfa" }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 2, background: "#8b5cf6", marginRight: 3 }} />
              Light {sleep.coreMinutes ? `${Math.round(sleep.coreMinutes)}m` : "—"}
            </span>
            <span style={{ color: "#d8b4fe" }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 2, background: "#c084fc", marginRight: 3 }} />
              REM {sleep.remMinutes ? `${Math.round(sleep.remMinutes)}m` : "—"}
            </span>
          </div>
          {sleep.bedTime && sleep.wakeTime && (
            <p className="text-[10px] mt-1.5" style={{ color: "var(--text-faint)" }}>
              {new Date(sleep.bedTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              {" → "}
              {new Date(sleep.wakeTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </p>
          )}
        </div>
      )}

      {/* Workout details */}
      {visible.includes("workouts") && summary?.workouts && summary.workouts.length > 0 && (
        <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid var(--border-primary)" }}>
          {summary.workouts.map((w, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
                {w.type}
              </span>
              <span style={{ color: "var(--text-faint)" }}>
                {w.durationMinutes}min · {w.calories} cal
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Hint for biometric "no data" */}
      {isPremium && visible.some(id => ["hrv", "rhr", "spo2", "respiratory"].includes(id)) &&
       !hrvValue && !rhrValue && !spo2Value && !respiratoryValue && (
        <p className="mt-3 pt-3 text-[10px] leading-tight" style={{ color: "var(--text-faint)", borderTop: "1px solid var(--border-primary)" }}>
          Biometrics require a device that writes to Apple Health (Apple Watch, Oura Ring, Garmin, etc.).
          Check Settings → Health → Routines365 to ensure all categories are enabled.
        </p>
      )}
    </div>
  );
}
