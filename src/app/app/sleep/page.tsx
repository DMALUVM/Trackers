"use client";

import { useEffect, useState } from "react";
import { Check, History, Moon, Smartphone } from "lucide-react";
import { useToday } from "@/lib/hooks";
import { useMultiActivityTotals, type MultiTotalsEntry } from "@/lib/hooks/useActivityTotals";
import { addActivityLog } from "@/lib/activity";
import { SkeletonCard, Toast, type ToastState } from "@/app/app/_components/ui";
import { hapticSuccess, hapticLight } from "@/lib/haptics";
import { isHealthKitAvailable, getLastNightSleep } from "@/lib/healthKit";
import Link from "next/link";

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")}${ampm}`;
}

export default function SleepPage() {
  const { dateKey } = useToday();
  const [hours, setHours] = useState("");
  const [score, setScore] = useState("");
  const [bedTime, setBedTime] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  const [toast, setToast] = useState<ToastState>("idle");
  const [justSaved, setJustSaved] = useState(false);
  const [hkLoaded, setHkLoaded] = useState(false);
  const [hkAvailable, setHkAvailable] = useState(false);
  const [source, setSource] = useState<"auto" | "manual">("auto");

  const entries: MultiTotalsEntry[] = [
    { activityKey: "sleep_hours", unit: "hours", label: "Sleep" },
    { activityKey: "sleep_score", unit: "score", label: "Sleep score" },
  ];
  const { data: totalsData, loading: totalsLoading, reload } = useMultiActivityTotals(entries);

  // Auto-fill from HealthKit
  useEffect(() => {
    const avail = isHealthKitAvailable();
    setHkAvailable(avail);
    if (!avail) { setSource("manual"); return; }

    void (async () => {
      try {
        const sleep = await getLastNightSleep();
        if (sleep && sleep.totalMinutes > 0) {
          setHours((sleep.totalMinutes / 60).toFixed(1));
          if (sleep.bedTime) setBedTime(formatTime(new Date(sleep.bedTime)));
          if (sleep.wakeTime) setWakeTime(formatTime(new Date(sleep.wakeTime)));
        }
      } catch { /* HealthKit not authorized yet */ }
      setHkLoaded(true);
    })();
  }, []);

  const handleSave = async () => {
    const hrs = Number(hours);
    if (!hrs || hrs <= 0) return;
    setToast("saving");
    try {
      await addActivityLog({ dateKey, activityKey: "sleep_hours", value: hrs, unit: "hours" });
      const s = Number(score);
      if (s > 0) await addActivityLog({ dateKey, activityKey: "sleep_score", value: s, unit: "score" });
      hapticSuccess();
      setJustSaved(true);
      setToast("saved");
      setTimeout(() => { setToast("idle"); setJustSaved(false); }, 2000);
      reload();
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  const fmt = (n: number) => n >= 10000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString();

  return (
    <div className="space-y-6">
      <Toast state={toast} />

      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          😴 Sleep
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Track your sleep duration and quality.</p>
      </header>

      {/* Source toggle — only show if HealthKit available */}
      {hkAvailable && (
        <div className="rounded-2xl p-1 flex gap-1" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          {([
            { key: "auto" as const, label: "Apple Health", icon: "❤️" },
            { key: "manual" as const, label: "Manual", icon: "✏️" },
          ]).map(({ key, label, icon }) => (
            <button key={key} type="button"
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-center transition-all duration-200"
              style={{
                background: source === key ? "var(--btn-primary-bg)" : "transparent",
                color: source === key ? "var(--btn-primary-text)" : "var(--text-muted)",
              }}
              onClick={() => { setSource(key); hapticLight(); }}>
              {icon} {label}
            </button>
          ))}
        </div>
      )}

      {/* HealthKit auto-detected sleep */}
      {source === "auto" && hkAvailable && (
        <section className="card p-5 space-y-4">
          {!hkLoaded ? (
            <SkeletonCard lines={3} />
          ) : hours ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Moon size={16} style={{ color: "#8b5cf6" }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                  Last night — from Apple Health
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center rounded-xl p-3" style={{ background: "var(--bg-card-hover)" }}>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{hours}</p>
                  <p className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>hours</p>
                </div>
                {bedTime && (
                  <div className="text-center rounded-xl p-3" style={{ background: "var(--bg-card-hover)" }}>
                    <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{bedTime}</p>
                    <p className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>bedtime</p>
                  </div>
                )}
                {wakeTime && (
                  <div className="text-center rounded-xl p-3" style={{ background: "var(--bg-card-hover)" }}>
                    <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{wakeTime}</p>
                    <p className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>wake</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>
                  Sleep score (1–100, optional)
                </label>
                <input className="mt-1.5 w-full rounded-xl px-4 py-3.5 text-base font-semibold tabular-nums"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)", fontSize: "1.125rem" }}
                  inputMode="numeric" placeholder="85" value={score}
                  onChange={(e) => setScore(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button type="button" className="btn-primary text-sm flex items-center justify-center gap-2" onClick={handleSave}>
                  {justSaved ? <><Check size={16} /> Logged!</> : "Log sleep"}
                </button>
                <Link href="/app/sleep" className="btn-secondary text-sm text-center flex items-center justify-center gap-2">
                  <History size={16} /> History
                </Link>
              </div>

              <p className="text-[10px] text-center" style={{ color: "var(--text-faint)" }}>
                <Smartphone size={10} className="inline mr-1" />
                Auto-detected from Apple Health
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <Moon size={24} className="mx-auto mb-2" style={{ color: "var(--text-faint)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>No sleep data found</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Wear your Apple Watch to bed or use Sleep Focus on your iPhone.
              </p>
              <button type="button" onClick={() => { hapticLight(); setSource("manual"); }}
                className="mt-3 text-xs font-semibold underline" style={{ color: "var(--accent-green-text)" }}>
                Enter manually instead
              </button>
            </div>
          )}
        </section>
      )}

      {/* Manual entry */}
      {source === "manual" && (
        <section className="card p-5 space-y-4">
          <div>
            <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>Hours slept</label>
            <input className="mt-1.5 w-full rounded-xl px-4 py-3.5 text-base font-semibold tabular-nums"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)", fontSize: "1.125rem" }}
              inputMode="decimal" placeholder="7.5" value={hours}
              onChange={(e) => setHours(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>Sleep score (1–100, optional)</label>
            <input className="mt-1.5 w-full rounded-xl px-4 py-3.5 text-base font-semibold tabular-nums"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)", fontSize: "1.125rem" }}
              inputMode="numeric" placeholder="85" value={score}
              onChange={(e) => setScore(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button type="button" className="btn-primary text-sm flex items-center justify-center gap-2" onClick={handleSave}>
              {justSaved ? <><Check size={16} /> Logged!</> : "Log sleep"}
            </button>
            <Link href="/app/sleep" className="btn-secondary text-sm text-center flex items-center justify-center gap-2">
              <History size={16} /> History
            </Link>
          </div>
        </section>
      )}

      {/* Totals */}
      {entries.map((entry) => {
        const key = `${entry.activityKey}:${entry.unit}`;
        const totals = totalsData[key] ?? { wtd: 0, mtd: 0, ytd: 0, all: 0 };
        if (totalsLoading) return <SkeletonCard key={key} lines={2} />;
        return (
          <div key={key} className="card p-4">
            <p className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: "var(--text-muted)" }}>
              {entry.label} <span style={{ color: "var(--text-faint)" }}>({entry.unit})</span>
            </p>
            <div className="grid grid-cols-4 gap-2">
              {(["WTD", "MTD", "YTD", "All"] as const).map((period, i) => {
                const vals = [totals.wtd, totals.mtd, totals.ytd, totals.all];
                return (
                  <div key={period} className="text-center">
                    <p className="text-[10px] font-bold tracking-wider" style={{ color: "var(--text-faint)" }}>{period}</p>
                    <p className="mt-0.5 text-base font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{fmt(vals[i])}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
