"use client";

import { useState, useEffect } from "react";
import { Activity, TrendingUp, Lock, Sparkles } from "lucide-react";
import { getBiometricSummary, isHealthKitAvailable, type BiometricReading } from "@/lib/healthKit";
import { usePremium } from "@/lib/premium";

interface HabitDay {
  date: string;
  completed: boolean;
}

interface Correlation {
  metric: string;
  emoji: string;
  habitName: string;
  avgWith: number;
  avgWithout: number;
  percentDiff: number;
  direction: "better" | "worse";
  unit: string;
  insight: string;
}

/**
 * Correlate habit completion with biometric data.
 * Compares metric averages on days habits were completed vs not.
 */
function computeCorrelations(
  habitDays: HabitDay[],
  habitName: string,
  hrv: BiometricReading[],
  rhr: BiometricReading[],
): Correlation[] {
  const correlations: Correlation[] = [];
  const completedDates = new Set(habitDays.filter(d => d.completed).map(d => d.date));
  const missedDates = new Set(habitDays.filter(d => !d.completed).map(d => d.date));

  // HRV correlation (higher is better)
  if (hrv.length >= 7) {
    const withHabit = hrv.filter(d => completedDates.has(d.date));
    const withoutHabit = hrv.filter(d => missedDates.has(d.date));

    if (withHabit.length >= 3 && withoutHabit.length >= 2) {
      const avgWith = withHabit.reduce((s, d) => s + d.value, 0) / withHabit.length;
      const avgWithout = withoutHabit.reduce((s, d) => s + d.value, 0) / withoutHabit.length;
      const diff = ((avgWith - avgWithout) / avgWithout) * 100;

      if (Math.abs(diff) >= 5) {
        correlations.push({
          metric: "HRV",
          emoji: "💚",
          habitName,
          avgWith: Math.round(avgWith * 10) / 10,
          avgWithout: Math.round(avgWithout * 10) / 10,
          percentDiff: Math.round(Math.abs(diff)),
          direction: diff > 0 ? "better" : "worse",
          unit: "ms",
          insight: diff > 0
            ? `Your HRV is ${Math.round(diff)}% higher on days you ${habitName.toLowerCase()}`
            : `Your HRV drops ${Math.round(Math.abs(diff))}% on days you ${habitName.toLowerCase()}`,
        });
      }
    }
  }

  // RHR correlation (lower is better)
  if (rhr.length >= 7) {
    const withHabit = rhr.filter(d => completedDates.has(d.date));
    const withoutHabit = rhr.filter(d => missedDates.has(d.date));

    if (withHabit.length >= 3 && withoutHabit.length >= 2) {
      const avgWith = withHabit.reduce((s, d) => s + d.value, 0) / withHabit.length;
      const avgWithout = withoutHabit.reduce((s, d) => s + d.value, 0) / withoutHabit.length;
      const diff = ((avgWithout - avgWith) / avgWithout) * 100; // flipped — lower is better

      if (Math.abs(diff) >= 3) {
        correlations.push({
          metric: "Resting HR",
          emoji: "❤️",
          habitName,
          avgWith: Math.round(avgWith),
          avgWithout: Math.round(avgWithout),
          percentDiff: Math.round(Math.abs(diff)),
          direction: diff > 0 ? "better" : "worse",
          unit: "bpm",
          insight: diff > 0
            ? `Your resting heart rate is ${Math.round(Math.abs(avgWithout - avgWith))} bpm lower on days you ${habitName.toLowerCase()}`
            : `Your resting heart rate rises ${Math.round(Math.abs(avgWith - avgWithout))} bpm on days you ${habitName.toLowerCase()}`,
        });
      }
    }
  }

  return correlations;
}

/**
 * BiometricCorrelations card.
 * Pass in habit completion data and it cross-references with HealthKit biometrics.
 */
export function BiometricCorrelations() {
  const { isPremium } = usePremium();
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHealthKitAvailable() || !isPremium) { setLoading(false); return; }

    void (async () => {
      try {
        const bio = await getBiometricSummary(30);
        if (!bio) { setLoading(false); return; }

        // Load habit data from localStorage
        const allCorrelations: Correlation[] = [];

        // Get all routine items from stored data
        try {
          const keys = Object.keys(localStorage).filter(k => k.startsWith("routines365:day:"));
          const habitMap: Record<string, HabitDay[]> = {};

          for (const key of keys) {
            const dateKey = key.replace("routines365:day:", "");
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const dayData = JSON.parse(raw);
            const items = dayData.items ?? dayData;
            if (!Array.isArray(items)) continue;

            for (const item of items) {
              if (!item.label) continue;
              if (!habitMap[item.label]) habitMap[item.label] = [];
              habitMap[item.label].push({
                date: dateKey,
                completed: !!item.done,
              });
            }
          }

          // Compute correlations for habits with enough data
          for (const [habitName, days] of Object.entries(habitMap)) {
            if (days.length < 14) continue; // need 2+ weeks
            const corrs = computeCorrelations(days, habitName, bio.hrv, bio.restingHeartRate);
            allCorrelations.push(...corrs);
          }
        } catch { /* ignore localStorage errors */ }

        // Sort by percent diff (most impactful first)
        allCorrelations.sort((a, b) => b.percentDiff - a.percentDiff);
        setCorrelations(allCorrelations.slice(0, 4));
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [isPremium]);

  if (!isHealthKitAvailable()) return null;
  if (loading) return null;

  // Premium gate
  if (!isPremium) {
    return (
      <div className="rounded-2xl p-4 relative overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} style={{ color: "#f59e0b" }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
            Habit × Body Correlations
          </span>
        </div>
        <div style={{ filter: "blur(5px)", opacity: 0.3 }}>
          <div className="space-y-2">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Your HRV is 18% higher on weeks you meditate</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Resting HR drops 4 bpm when you exercise</p>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <a href="/app/settings/premium" className="flex items-center gap-1.5 rounded-full px-4 py-2"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", textDecoration: "none" }}>
            <Lock size={12} style={{ color: "var(--text-faint)" }} />
            <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Unlock Insights</span>
          </a>
        </div>
      </div>
    );
  }

  if (correlations.length === 0) {
    // Not enough data yet
    return (
      <div className="rounded-2xl p-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} style={{ color: "#f59e0b" }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
            Habit × Body
          </span>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Keep tracking for 2+ weeks with a wearable connected. We&apos;ll show you how your habits affect your HRV and heart rate.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} style={{ color: "#f59e0b" }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
          Habit × Body Correlations
        </span>
      </div>
      <div className="space-y-3">
        {correlations.map((c, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="text-sm shrink-0 mt-0.5">{c.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {c.insight}
              </p>
              <div className="flex gap-3 mt-1">
                <span className="text-[10px] tabular-nums" style={{ color: "var(--accent-green-text)" }}>
                  ✓ {c.avgWith} {c.unit}
                </span>
                <span className="text-[10px] tabular-nums" style={{ color: "var(--text-faint)" }}>
                  ✕ {c.avgWithout} {c.unit}
                </span>
                <span className="text-[10px] font-bold" style={{ color: c.direction === "better" ? "#10b981" : "#ef4444" }}>
                  {c.direction === "better" ? "↑" : "↓"} {c.percentDiff}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
