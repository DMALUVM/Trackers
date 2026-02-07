"use client";

import { useEffect, useState } from "react";
import { Check, Circle } from "lucide-react";
import { useToday } from "@/lib/hooks";
import { useActivityTotals } from "@/lib/hooks/useActivityTotals";
import { addActivityLog, deleteActivityLogsForDate, listActivityLogs } from "@/lib/activity";
import { Toast, SkeletonCard, type ToastState } from "@/app/app/_components/ui";
import { hapticSuccess, hapticLight } from "@/lib/haptics";

export default function NeuroPage() {
  const { dateKey } = useToday();
  const [done, setDone] = useState(false);
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState<ToastState>("idle");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const { totals, loading: totalsLoading } = useActivityTotals("neuro", "sessions");

  useEffect(() => {
    void (async () => {
      try {
        const rows = await listActivityLogs({ from: dateKey, to: dateKey, activityKey: "neuro" });
        if (rows.length > 0) { setDone(true); setNotes(rows[0].notes ?? ""); }
      } catch { /* defaults */ }
      setLoaded(true);
    })();
  }, [dateKey]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setToast("saving");
    try {
      await deleteActivityLogsForDate({ dateKey, activityKey: "neuro" });
      if (done) await addActivityLog({ dateKey, activityKey: "neuro", value: 1, unit: "sessions", notes: notes || null });
      hapticSuccess();
      setToast("saved");
      setTimeout(() => setToast("idle"), 1500);
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    } finally { setSaving(false); }
  };

  if (!loaded) return <SkeletonCard lines={3} />;

  return (
    <div className="space-y-6">
      <Toast state={toast} />

      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Neuro</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Track neurofeedback sessions.</p>
      </header>

      {/* Big toggle */}
      <section className="card p-5">
        <button type="button" onClick={() => { setDone((d) => !d); hapticLight(); }}
          className="w-full rounded-2xl p-5 text-center transition-all duration-300 active:scale-95"
          style={{
            background: done ? "var(--accent-green-soft)" : "var(--bg-card-hover)",
            border: `2px solid ${done ? "var(--accent-green)" : "var(--border-primary)"}`,
          }}>
          <div className="flex justify-center mb-3">
            {done ? (
              <div className="rounded-full flex items-center justify-center animate-check-pulse"
                style={{ width: 48, height: 48, background: "var(--accent-green)" }}>
                <Check size={24} strokeWidth={3} style={{ color: "var(--text-inverse)" }} />
              </div>
            ) : (
              <div className="rounded-full flex items-center justify-center"
                style={{ width: 48, height: 48, border: "2px solid var(--text-faint)" }}>
                <Circle size={24} style={{ color: "var(--text-faint)" }} />
              </div>
            )}
          </div>
          <p className="text-base font-bold" style={{ color: done ? "var(--accent-green-text)" : "var(--text-primary)" }}>
            {done ? "Session done ✓" : "Tap to mark done"}
          </p>
        </button>

        <div className="mt-4">
          <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>Notes</label>
          <textarea className="mt-1.5 w-full rounded-xl px-4 py-3 text-sm resize-none" rows={3}
            style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
            placeholder="How was the session?"
            value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <button type="button" className="btn-primary w-full text-sm mt-3" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </section>

      {/* Totals */}
      {!totalsLoading && (
        <section className="card p-4">
          <p className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: "var(--text-muted)" }}>Sessions</p>
          <div className="grid grid-cols-4 gap-2">
            {(["WTD", "MTD", "YTD", "All"] as const).map((p, i) => (
              <div key={p} className="text-center">
                <p className="text-[10px] font-bold tracking-wider" style={{ color: "var(--text-faint)" }}>{p}</p>
                <p className="mt-0.5 text-base font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {[totals.wtd, totals.mtd, totals.ytd, totals.all][i]}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
