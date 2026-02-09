"use client";

import { useEffect, useState } from "react";
import { getBiometricSummary, isHealthKitAvailable, type BiometricReading, type BiometricSummary } from "@/lib/healthKit";

export interface BiometricTrend {
  current: number | null;
  avg7d: number | null;
  avg30d: number | null;
  /** Percentage change: 7-day avg vs 30-day avg. Positive = improving for HRV, negative = improving for RHR */
  trend: number | null;
  direction: "improving" | "declining" | "stable" | null;
  data: BiometricReading[];
}

export interface BiometricData {
  loading: boolean;
  available: boolean;
  hrv: BiometricTrend;
  restingHeartRate: BiometricTrend;
  respiratoryRate: BiometricTrend;
  bloodOxygen: BiometricTrend;
}

function computeTrend(data: BiometricReading[], higherIsBetter: boolean): BiometricTrend {
  if (data.length === 0) {
    return { current: null, avg7d: null, avg30d: null, trend: null, direction: null, data: [] };
  }

  // Data is sorted newest first
  const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
  const current = sorted[0]?.value ?? null;

  const now = new Date();
  const d7 = new Date(now); d7.setDate(d7.getDate() - 7);
  const d7Key = d7.toISOString().slice(0, 10);

  const last7 = sorted.filter(d => d.date >= d7Key);
  const avg7d = last7.length > 0 ? Math.round((last7.reduce((s, d) => s + d.value, 0) / last7.length) * 10) / 10 : null;
  const avg30d = Math.round((sorted.reduce((s, d) => s + d.value, 0) / sorted.length) * 10) / 10;

  let trend: number | null = null;
  let direction: "improving" | "declining" | "stable" | null = null;

  if (avg7d !== null && avg30d !== null && avg30d !== 0) {
    trend = Math.round(((avg7d - avg30d) / avg30d) * 1000) / 10;
    if (Math.abs(trend) < 2) {
      direction = "stable";
    } else if (higherIsBetter) {
      direction = trend > 0 ? "improving" : "declining";
    } else {
      direction = trend < 0 ? "improving" : "declining";
    }
  }

  return { current, avg7d, avg30d, trend, direction, data: sorted };
}

const empty: BiometricTrend = { current: null, avg7d: null, avg30d: null, trend: null, direction: null, data: [] };

export function useBiometrics(days = 30): BiometricData {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<BiometricSummary | null>(null);
  const available = isHealthKitAvailable();

  useEffect(() => {
    if (!available) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const data = await getBiometricSummary(days);
        if (!cancelled) setSummary(data);
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [days, available]);

  if (!summary) {
    return { loading, available, hrv: empty, restingHeartRate: empty, respiratoryRate: empty, bloodOxygen: empty };
  }

  return {
    loading,
    available,
    hrv: computeTrend(summary.hrv, true),              // Higher HRV = better
    restingHeartRate: computeTrend(summary.restingHeartRate, false), // Lower RHR = better
    respiratoryRate: computeTrend(summary.respiratoryRate, false),   // Lower = calmer
    bloodOxygen: computeTrend(summary.bloodOxygen, true),            // Higher = better
  };
}
