"use client";

import { useState } from "react";
import { Flame, Snowflake, Check } from "lucide-react";
import { useToday } from "@/lib/hooks";
import { useMultiActivityTotals } from "@/lib/hooks/useActivityTotals";
import { addActivityLog } from "@/lib/activity";
import { Toast, SkeletonCard, type ToastState } from "@/app/app/_components/ui";
import { hapticSuccess, hapticLight } from "@/lib/haptics";

const ENTRIES = [
  { activityKey: "sauna" as const, unit: "sessions" as const, label: "Sauna" },
  { activityKey: "cold" as const, unit: "sessions" as const, label: "Cold plunge" },
];

function TotalsRow({ totals }: { totals: { wtd: number; mtd: number; ytd: number; all: number } }) {
  return (
    <div className="grid grid-cols-4 gap-2 mt-3">
      {(["WTD", "MTD", "YTD", "All"] as const).map((p, i) => (
        <div key={p} className="text-center">
          <p className="text-[10px] font-bold tracking-wider" style={{ color: "var(--text-faint)" }}>{p}</p>
          <p className="mt-0.5 text-base font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
            {[totals.wtd, totals.mtd, totals.ytd, totals.all][i]}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function RecoveryPage() {
  const { dateKey } = useToday();
  const [toast, setToast] = useState<ToastState>("idle");
  const [justLogged, setJustLogged] = useState<"sauna" | "cold" | null>(null);
  const { data, loading, reload } = useMultiActivityTotals(ENTRIES);

  const logSession = async (key: "sauna" | "cold") => {
    hapticSuccess();
    setJustLogged(key);
    setToast("saving");
    try {
      await addActivityLog({ dateKey, activityKey: key, value: 1, unit: "sessions" });
      setToast("saved");
      setTimeout(() => setToast("idle"), 1500);
      setTimeout(() => setJustLogged(null), 1200);
      reload();
    } catch {
      setToast("error");
      setJustLogged(null);
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <Toast state={toast} />

      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Recovery</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Tap to log a session.</p>
      </header>

      {/* Big tap buttons */}
      <div className="grid grid-cols-2 gap-4">
        {([
          { key: "sauna" as const, Icon: Flame, label: "Sauna", color: "var(--accent-red)", softBg: "var(--accent-red-soft)" },
          { key: "cold" as const, Icon: Snowflake, label: "Cold Plunge", color: "var(--accent-green)", softBg: "var(--accent-green-soft)" },
        ]).map(({ key, Icon, label, color, softBg }) => {
          const logged = justLogged === key;
          return (
            <button key={key} type="button"
              className="rounded-2xl p-6 text-center transition-all duration-300 active:scale-95"
              style={{
                background: logged ? softBg : "var(--bg-card)",
                border: `2px solid ${logged ? color : "var(--border-primary)"}`,
                transform: logged ? "scale(1.02)" : undefined,
              }}
              onClick={() => logSession(key)}>
              <div className="flex justify-center mb-3">
                {logged ? (
                  <div className="rounded-full flex items-center justify-center animate-check-pulse"
                    style={{ width: 48, height: 48, background: color }}>
                    <Check size={24} strokeWidth={3} style={{ color: "var(--text-inverse)" }} />
                  </div>
                ) : (
                  <Icon size={36} style={{ color }} />
                )}
              </div>
              <p className="text-base font-bold" style={{ color: logged ? color : "var(--text-primary)" }}>
                {logged ? "+1 Logged!" : label}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {logged ? "Nice work" : "Tap to log +1"}
              </p>
            </button>
          );
        })}
      </div>

      {/* Totals */}
      {loading ? <SkeletonCard lines={2} /> : (
        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>🔥 Sauna</p>
            <TotalsRow totals={data["sauna:sessions"] ?? { wtd: 0, mtd: 0, ytd: 0, all: 0 }} />
          </div>
          <div className="card p-4">
            <p className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>❄️ Cold plunge</p>
            <TotalsRow totals={data["cold:sessions"] ?? { wtd: 0, mtd: 0, ytd: 0, all: 0 }} />
          </div>
        </div>
      )}
    </div>
  );
}
