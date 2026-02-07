"use client";

import { useState } from "react";
import { Flame, Snowflake } from "lucide-react";
import { useToday } from "@/lib/hooks";
import { useMultiActivityTotals } from "@/lib/hooks/useActivityTotals";
import { addActivityLog } from "@/lib/activity";
import { Toast, SkeletonCard, type ToastState } from "@/app/app/_components/ui";

const ENTRIES = [
  { activityKey: "sauna" as const, unit: "sessions" as const, label: "Sauna" },
  { activityKey: "cold" as const, unit: "sessions" as const, label: "Cold plunge" },
];

function TotalsRow({ label, totals }: { label: string; totals: { wtd: number; mtd: number; ytd: number; all: number } }) {
  return (
    <div className="grid grid-cols-4 gap-2 mt-2">
      {(["WTD", "MTD", "YTD", "All"] as const).map((p, i) => (
        <div key={p} className="text-center">
          <p className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>{p}</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
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
  const { data, loading, reload } = useMultiActivityTotals(ENTRIES);

  const logSession = async (key: "sauna" | "cold") => {
    setToast("saving");
    try {
      await addActivityLog({ dateKey, activityKey: key, value: 1, unit: "sessions" });
      setToast("saved");
      setTimeout(() => setToast("idle"), 1500);
      reload();
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  return (
    <div className="space-y-5">
      <Toast state={toast} />

      <header>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          🧖 Recovery
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>One-tap session logging.</p>
      </header>

      {/* One-tap buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="card p-5 text-center" onClick={() => logSession("sauna")}>
          <Flame size={28} style={{ color: "var(--accent-red)", margin: "0 auto" }} />
          <p className="mt-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Sauna</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Tap to log +1</p>
        </button>
        <button type="button" className="card p-5 text-center" onClick={() => logSession("cold")}>
          <Snowflake size={28} style={{ color: "var(--accent-green)", margin: "0 auto" }} />
          <p className="mt-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Cold plunge</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Tap to log +1</p>
        </button>
      </div>

      {/* Totals */}
      {loading ? <SkeletonCard lines={2} /> : (
        <>
          <div className="card p-4">
            <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>🔥 Sauna (sessions)</p>
            <TotalsRow label="Sauna" totals={data["sauna:sessions"] ?? { wtd: 0, mtd: 0, ytd: 0, all: 0 }} />
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>❄️ Cold plunge (sessions)</p>
            <TotalsRow label="Cold" totals={data["cold:sessions"] ?? { wtd: 0, mtd: 0, ytd: 0, all: 0 }} />
          </div>
        </>
      )}
    </div>
  );
}
