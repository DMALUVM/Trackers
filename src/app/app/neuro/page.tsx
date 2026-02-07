"use client";

import { useEffect, useState } from "react";
import { useToday } from "@/lib/hooks";
import { useActivityTotals } from "@/lib/hooks/useActivityTotals";
import { addActivityLog, deleteActivityLogsForDate, listActivityLogs } from "@/lib/activity";
import { Toast, SkeletonCard, type ToastState } from "@/app/app/_components/ui";
import { format } from "date-fns";

export default function NeuroPage() {
  const { dateKey } = useToday();
  const [done, setDone] = useState(false);
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState<ToastState>("idle");
  const [loaded, setLoaded] = useState(false);
  const { totals, loading: totalsLoading } = useActivityTotals("neuro", "sessions");

  // Load today's state
  useEffect(() => {
    void (async () => {
      try {
        const from = dateKey;
        const to = dateKey;
        const rows = await listActivityLogs({ from, to, activityKey: "neuro" });
        if (rows.length > 0) {
          setDone(true);
          setNotes(rows[0].notes ?? "");
        }
      } catch { /* stay defaults */ }
      setLoaded(true);
    })();
  }, [dateKey]);

  const save = async () => {
    setToast("saving");
    try {
      // Remove existing for today, then re-add if done
      await deleteActivityLogsForDate({ dateKey, activityKey: "neuro" });
      if (done) {
        await addActivityLog({ dateKey, activityKey: "neuro", value: 1, unit: "sessions", notes: notes || null });
      }
      setToast("saved");
      setTimeout(() => setToast("idle"), 1500);
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  if (!loaded) return <SkeletonCard lines={3} />;

  return (
    <div className="space-y-5">
      <Toast state={toast} />

      <header>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>🧠 Neuro</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Track neurofeedback sessions.</p>
      </header>

      <section className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Session today</p>
          <button type="button" className={done ? "btn-primary text-xs py-2 px-4" : "btn-secondary text-xs py-2 px-4"}
            onClick={() => setDone((d) => !d)}>
            {done ? "✓ Done" : "Not done"}
          </button>
        </div>

        <div>
          <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Notes (optional)</label>
          <textarea className="mt-1 w-full rounded-xl px-3 py-3 text-sm resize-none" rows={3}
            style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
            placeholder="How was the session?"
            value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <button type="button" className="btn-primary w-full text-sm" onClick={save}>Save</button>
      </section>

      {/* Totals */}
      {!totalsLoading && (
        <div className="card p-4">
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>Sessions</p>
          <div className="grid grid-cols-4 gap-2">
            {(["WTD", "MTD", "YTD", "All"] as const).map((p, i) => (
              <div key={p} className="text-center">
                <p className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>{p}</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {[totals.wtd, totals.mtd, totals.ytd, totals.all][i]}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
