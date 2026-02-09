"use client";

import { useState } from "react";
import { Activity, Heart, Wind, Droplets, TrendingUp, TrendingDown, Minus, Lock } from "lucide-react";
import { SubPageHeader, SkeletonCard } from "@/app/app/_components/ui";
import { useBiometrics, type BiometricTrend } from "@/lib/hooks/useBiometrics";
import { usePremium } from "@/lib/premium";
import type { BiometricReading } from "@/lib/healthKit";

// ── Mini sparkline chart ──

function Sparkline({ data, color, height = 48 }: { data: BiometricReading[]; color: string; height?: number }) {
  if (data.length < 2) return null;

  // Oldest → newest for left-to-right
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const values = sorted.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const w = 200;
  const h = height;
  const padding = 4;
  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (w - 2 * padding);
    const y = h - padding - ((v - min) / range) * (h - 2 * padding);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      {/* Area fill */}
      <path
        d={`M${points[0]} ${points.join(" L")} L${w - padding},${h - padding} L${padding},${h - padding} Z`}
        fill={`${color}15`}
      />
      {/* Line */}
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current value dot */}
      <circle cx={points[points.length - 1].split(",")[0]} cy={points[points.length - 1].split(",")[1]} r="3" fill={color} />
    </svg>
  );
}

// ── Trend badge ──

function TrendBadge({ trend }: { trend: BiometricTrend }) {
  if (trend.direction === null || trend.trend === null) return null;

  const colors = {
    improving: { bg: "rgba(16,185,129,0.1)", text: "#10b981" },
    declining: { bg: "rgba(239,68,68,0.1)", text: "#ef4444" },
    stable: { bg: "rgba(107,114,128,0.1)", text: "#6b7280" },
  };

  const c = colors[trend.direction];
  const Icon = trend.direction === "improving" ? TrendingUp : trend.direction === "declining" ? TrendingDown : Minus;

  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{ background: c.bg, color: c.text }}>
      <Icon size={10} />
      {Math.abs(trend.trend).toFixed(1)}%
    </span>
  );
}

// ── Metric card ──

function MetricCard({
  icon: Icon,
  color,
  label,
  unit,
  trend,
  locked,
}: {
  icon: typeof Heart;
  color: string;
  label: string;
  unit: string;
  trend: BiometricTrend;
  locked: boolean;
}) {
  if (locked) {
    return (
      <div className="rounded-2xl p-4 relative overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="rounded-lg p-1.5" style={{ background: `${color}15` }}>
            <Icon size={16} style={{ color }} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
            {label}
          </span>
        </div>
        <div className="flex items-center justify-center py-6" style={{ filter: "blur(6px)", opacity: 0.3 }}>
          <span className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>42</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
            <Lock size={12} style={{ color: "var(--text-faint)" }} />
            <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Premium</span>
          </div>
        </div>
      </div>
    );
  }

  const hasData = trend.current !== null;

  return (
    <div className="rounded-2xl p-4"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg p-1.5" style={{ background: `${color}15` }}>
            <Icon size={16} style={{ color }} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
            {label}
          </span>
        </div>
        <TrendBadge trend={trend} />
      </div>

      {hasData ? (
        <>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-3xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {trend.current}
            </span>
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>{unit}</span>
          </div>

          <div className="flex gap-4 mb-3">
            <div>
              <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>7d avg </span>
              <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>
                {trend.avg7d ?? "—"}
              </span>
            </div>
            <div>
              <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>30d avg </span>
              <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>
                {trend.avg30d ?? "—"}
              </span>
            </div>
          </div>

          <Sparkline data={trend.data} color={color} />
        </>
      ) : (
        <div className="py-4 text-center">
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>No data yet</p>
          <p className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>
            Connect a wearable to Apple Health
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main page ──

export default function BiometricsPage() {
  const bio = useBiometrics(30);
  const { isPremium } = usePremium();
  const canViewBiometrics = isPremium;
  const [period, setPeriod] = useState<7 | 14 | 30>(30);

  if (bio.loading) {
    return (
      <div className="space-y-6">
        <SubPageHeader title="Biometric Insights" subtitle="How your habits affect your body" />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  // Insight generation
  const insights: Array<{ emoji: string; text: string }> = [];

  if (bio.hrv.direction === "improving") {
    insights.push({ emoji: "💚", text: "Your HRV is trending up — a sign of better recovery and lower stress." });
  } else if (bio.hrv.direction === "declining") {
    insights.push({ emoji: "⚠️", text: "Your HRV has dipped recently. Prioritize sleep and recovery." });
  }

  if (bio.restingHeartRate.direction === "improving") {
    insights.push({ emoji: "💪", text: "Resting heart rate is dropping — your cardiovascular fitness is improving." });
  } else if (bio.restingHeartRate.direction === "declining") {
    insights.push({ emoji: "📉", text: "Your resting heart rate has crept up. Could be stress, poor sleep, or overtraining." });
  }

  if (bio.bloodOxygen.current !== null && bio.bloodOxygen.current < 95) {
    insights.push({ emoji: "🫁", text: "Blood oxygen below 95% — consider checking in with a healthcare provider." });
  }

  if (bio.hrv.data.length >= 7 && bio.restingHeartRate.data.length >= 7 && insights.length === 0) {
    insights.push({ emoji: "✅", text: "Your biometrics look stable. Keep up the consistency." });
  }

  return (
    <div className="space-y-5">
      <SubPageHeader
        title="Biometric Insights"
        subtitle="How your habits affect your body"
        backHref="/app/routines/progress"
      />

      {/* Period selector */}
      <div className="flex gap-2">
        {([7, 14, 30] as const).map((p) => (
          <button key={p} type="button"
            onClick={() => setPeriod(p)}
            className="rounded-full px-3 py-1.5 text-xs font-bold transition-all"
            style={{
              background: period === p ? "var(--accent-green)" : "var(--bg-card)",
              color: period === p ? "var(--text-inverse)" : "var(--text-muted)",
              border: `1px solid ${period === p ? "var(--accent-green)" : "var(--border-primary)"}`,
            }}>
            {p}d
          </button>
        ))}
      </div>

      {/* Insights */}
      {isPremium && insights.length > 0 && (
        <div className="rounded-2xl p-4 space-y-2"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
            Insights
          </p>
          {insights.map((ins, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-sm shrink-0">{ins.emoji}</span>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{ins.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4">
        <MetricCard icon={Activity} color="#8b5cf6" label="HRV" unit="ms" trend={bio.hrv} locked={!isPremium} />
        <MetricCard icon={Heart} color="#ef4444" label="Resting Heart Rate" unit="bpm" trend={bio.restingHeartRate} locked={!isPremium} />
        <MetricCard icon={Wind} color="#06b6d4" label="Respiratory Rate" unit="br/min" trend={bio.respiratoryRate} locked={!isPremium} />
        <MetricCard icon={Droplets} color="#3b82f6" label="Blood Oxygen" unit="%" trend={bio.bloodOxygen} locked={!isPremium} />
      </div>

      {/* Premium upsell */}
      {!isPremium && (
        <div className="rounded-2xl p-5 text-center"
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))", border: "1px solid rgba(139,92,246,0.2)" }}>
          <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Unlock Biometric Insights
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            See how your daily habits correlate with HRV, heart rate, and recovery. Track trends from your Oura Ring, Apple Watch, or Garmin.
          </p>
          <a href="/app/settings/premium"
            className="inline-block mt-3 rounded-xl px-6 py-2.5 text-sm font-bold"
            style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>
            Start 7-Day Free Trial
          </a>
        </div>
      )}

      {!bio.available && (
        <div className="text-center py-6">
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            Apple Health is only available in the native iOS app.
          </p>
        </div>
      )}
    </div>
  );
}
