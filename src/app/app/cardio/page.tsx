"use client";

import { useEffect, useState } from "react";
import { Check, History, Footprints, Smartphone } from "lucide-react";
import { ActivityLogger } from "@/app/app/_components/ActivityLogger";
import { useToday } from "@/lib/hooks";
import { useMultiActivityTotals, type MultiTotalsEntry } from "@/lib/hooks/useActivityTotals";
import { addActivityLog } from "@/lib/activity";
import { SkeletonCard, Toast, type ToastState } from "@/app/app/_components/ui";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import { isHealthKitAvailable, getTodaySteps } from "@/lib/healthKit";
import Link from "next/link";

export default function CardioPage() {
  const { dateKey } = useToday();
  const [mode, setMode] = useState<"walking" | "running">("walking");
  const [hkAvailable, setHkAvailable] = useState(false);
  const [hkSteps, setHkSteps] = useState<number | null>(null);
  const [hkLoaded, setHkLoaded] = useState(false);
  const [steps, setSteps] = useState("");
  const [toast, setToast] = useState<ToastState>("idle");
  const [justSaved, setJustSaved] = useState(false);
  const [source, setSource] = useState<"auto" | "manual">("auto");

  const entries: MultiTotalsEntry[] = [
    { activityKey: "walking", unit: "steps", label: "Walking" },
  ];
  const { data: totalsData, loading: totalsLoading, reload } = useMultiActivityTotals(entries);

  // Load HealthKit steps
  useEffect(() => {
    const avail = isHealthKitAvailable();
    setHkAvailable(avail);
    if (!avail) { setSource("manual"); setHkLoaded(true); return; }

    void (async () => {
      try {
        const s = await getTodaySteps();
        if (s > 0) {
          setHkSteps(s);
          setSteps(String(s));
        }
      } catch { /* not authorized */ }
      setHkLoaded(true);
    })();
  }, []);

  const handleSaveSteps = async () => {
    const val = Number(steps);
    if (!val || val <= 0) return;
    setToast("saving");
    try {
      await addActivityLog({ dateKey, activityKey: "walking", value: val, unit: "steps" });
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

      {/* Segmented control */}
      <div className="rounded-2xl p-1 flex gap-1" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
        {([
          { key: "walking" as const, label: "🚶 Walking" },
          { key: "running" as const, label: "🏃 Running" },
        ]).map(({ key, label }) => (
          <button key={key} type="button"
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-center transition-all duration-200"
            style={{
              background: mode === key ? "var(--btn-primary-bg)" : "transparent",
              color: mode === key ? "var(--btn-primary-text)" : "var(--text-muted)",
            }}
            onClick={() => { setMode(key); hapticLight(); }}>
            {label}
          </button>
        ))}
      </div>

      {mode === "walking" ? (
        <>
          <header>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>🚶 Walking</h1>
          </header>

          {/* Source toggle for walking */}
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

          {/* HealthKit steps */}
          {source === "auto" && hkAvailable && (
            <section className="card p-5 space-y-4">
              {!hkLoaded ? (
                <SkeletonCard lines={2} />
              ) : hkSteps ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Footprints size={16} style={{ color: "#3b82f6" }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                      Today — from Apple Health
                    </span>
                  </div>

                  <div className="text-center rounded-xl p-4" style={{ background: "var(--bg-card-hover)" }}>
                    <p className="text-4xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                      {hkSteps.toLocaleString()}
                    </p>
                    <p className="text-xs font-medium mt-1" style={{ color: "var(--text-faint)" }}>steps</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button type="button" className="btn-primary text-sm flex items-center justify-center gap-2" onClick={handleSaveSteps}>
                      {justSaved ? <><Check size={16} /> Logged!</> : "Log steps"}
                    </button>
                    <Link href="/app/cardio/history" className="btn-secondary text-sm text-center flex items-center justify-center gap-2">
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
                  <Footprints size={24} className="mx-auto mb-2" style={{ color: "var(--text-faint)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>No step data yet today</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Carry your iPhone or wear your Apple Watch to track steps.
                  </p>
                  <button type="button" onClick={() => { hapticLight(); setSource("manual"); }}
                    className="mt-3 text-xs font-semibold underline" style={{ color: "var(--accent-green-text)" }}>
                    Enter manually instead
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Manual steps */}
          {source === "manual" && (
            <section className="card p-5 space-y-4">
              <div>
                <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>Steps</label>
                <input className="mt-1.5 w-full rounded-xl px-4 py-3.5 text-base font-semibold tabular-nums"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)", fontSize: "1.125rem" }}
                  inputMode="numeric" placeholder="8500" value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveSteps(); }} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button type="button" className="btn-primary text-sm flex items-center justify-center gap-2" onClick={handleSaveSteps}>
                  {justSaved ? <><Check size={16} /> Logged!</> : "Log steps"}
                </button>
                <Link href="/app/cardio/history" className="btn-secondary text-sm text-center flex items-center justify-center gap-2">
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
        </>
      ) : (
        <ActivityLogger
          title="Running" activityKey="running" emoji="🏃"
          fields={[{ name: "miles", label: "Miles", unit: "miles", inputMode: "decimal", placeholder: "2.5", required: true }]}
          historyHref="/app/cardio/history"
        />
      )}
    </div>
  );
}
