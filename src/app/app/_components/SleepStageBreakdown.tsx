"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Moon, Lock } from "lucide-react";
import { getSleep, type HealthKitSleep } from "@/lib/healthKit";
import { isHealthKitAvailable } from "@/lib/healthKit";
import { usePremium } from "@/lib/premium";

function formatHM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function SleepBar({ data, maxMinutes }: { data: HealthKitSleep; maxMinutes: number }) {
  const deep = data.deepMinutes ?? 0;
  const core = data.coreMinutes ?? 0;
  const rem = data.remMinutes ?? 0;
  const other = Math.max(0, data.totalMinutes - deep - core - rem);
  const total = data.totalMinutes;
  const w = maxMinutes > 0 ? (total / maxMinutes) * 100 : 0;

  const dayLabel = (() => {
    try {
      const d = new Date(data.date + "T12:00:00");
      return d.toLocaleDateString("en-US", { weekday: "short" });
    } catch { return data.date.slice(-2); }
  })();

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-medium w-8 text-right tabular-nums shrink-0"
        style={{ color: "var(--text-faint)" }}>{dayLabel}</span>
      <div className="flex-1 h-5 rounded-md overflow-hidden flex" style={{ width: `${w}%`, minWidth: "20px" }}>
        {deep > 0 && (
          <div style={{ width: `${(deep / total) * 100}%`, background: "#6366f1" }}
            title={`Deep: ${formatHM(deep)}`} />
        )}
        {core > 0 && (
          <div style={{ width: `${(core / total) * 100}%`, background: "#818cf8" }}
            title={`Core: ${formatHM(core)}`} />
        )}
        {rem > 0 && (
          <div style={{ width: `${(rem / total) * 100}%`, background: "#a78bfa" }}
            title={`REM: ${formatHM(rem)}`} />
        )}
        {other > 0 && (
          <div style={{ width: `${(other / total) * 100}%`, background: "#c4b5fd" }}
            title={`Other: ${formatHM(other)}`} />
        )}
      </div>
      <span className="text-[10px] font-bold tabular-nums w-10 shrink-0"
        style={{ color: "var(--text-muted)" }}>{formatHM(total)}</span>
    </div>
  );
}

export function SleepStageBreakdown() {
  const { isPremium } = usePremium();
  const [sleepData, setSleepData] = useState<HealthKitSleep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHealthKitAvailable()) { setLoading(false); return; }
    void (async () => {
      try {
        const data = await getSleep(7);
        setSleepData(data);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  if (!isHealthKitAvailable() || loading) return null;
  if (sleepData.length === 0) return null;

  // Check if we have stage data (only devices like Oura/Apple Watch provide this)
  const hasStages = sleepData.some(d => (d.deepMinutes ?? 0) > 0 || (d.remMinutes ?? 0) > 0);

  const maxMinutes = Math.max(...sleepData.map(d => d.totalMinutes), 1);
  const avgSleep = sleepData.reduce((s, d) => s + d.totalMinutes, 0) / sleepData.length;
  const avgDeep = hasStages ? sleepData.reduce((s, d) => s + (d.deepMinutes ?? 0), 0) / sleepData.length : 0;
  const avgREM = hasStages ? sleepData.reduce((s, d) => s + (d.remMinutes ?? 0), 0) / sleepData.length : 0;

  // Sort oldest → newest for chart
  const sorted = [...sleepData].sort((a, b) => a.date.localeCompare(b.date));

  if (!isPremium) {
    return (
      <div className="rounded-2xl p-4 relative overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Moon size={14} style={{ color: "#8b5cf6" }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
            Sleep Stages
          </span>
        </div>
        <div style={{ filter: "blur(4px)", opacity: 0.3 }}>
          <div className="space-y-1.5">
            {sorted.slice(0, 4).map((d) => (
              <SleepBar key={d.date} data={d} maxMinutes={maxMinutes} />
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Link href="/app/settings/premium" className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", textDecoration: "none" }}>
            <Lock size={12} style={{ color: "var(--text-faint)" }} />
            <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Premium</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Moon size={14} style={{ color: "#8b5cf6" }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
            Sleep — 7 Days
          </span>
        </div>
        <span className="text-xs font-bold tabular-nums" style={{ color: "var(--text-muted)" }}>
          avg {formatHM(avgSleep)}
        </span>
      </div>

      {/* Stacked bar chart */}
      <div className="space-y-1.5 mb-3">
        {sorted.map((d) => (
          <SleepBar key={d.date} data={d} maxMinutes={maxMinutes} />
        ))}
      </div>

      {/* Legend + averages */}
      {hasStages ? (
        <div className="flex flex-wrap gap-3 pt-2" style={{ borderTop: "1px solid var(--border-primary)" }}>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#6366f1" }} />
            <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>Deep {formatHM(avgDeep)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#818cf8" }} />
            <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>Core</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#a78bfa" }} />
            <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>REM {formatHM(avgREM)}</span>
          </div>
        </div>
      ) : (
        <p className="text-[10px] pt-2" style={{ color: "var(--text-faint)", borderTop: "1px solid var(--border-primary)" }}>
          Connect an Oura Ring or Apple Watch for sleep stage breakdown
        </p>
      )}
    </div>
  );
}
