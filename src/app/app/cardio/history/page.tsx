"use client";

import { useEffect, useMemo, useState } from "react";
import { subDays, format } from "date-fns";
import { Trash2 } from "lucide-react";
import { deleteActivityLog, listActivityLogs } from "@/lib/activity";

export default function CardioHistoryPage() {
  const now = useMemo(() => new Date(), []);
  const from = useMemo(() => format(subDays(now, 30), "yyyy-MM-dd"), [now]);
  const to = useMemo(() => format(now, "yyyy-MM-dd"), [now]);

  const [walking, setWalking] = useState<any[]>([]);
  const [running, setRunning] = useState<any[]>([]);
  const [status, setStatus] = useState<string>("");

  const refresh = async () => {
    const [w, r] = await Promise.all([
      listActivityLogs({ from, to, activityKey: "walking" }),
      listActivityLogs({ from, to, activityKey: "running" }),
    ]);
    setWalking(w);
    setRunning(r);
  };

  useEffect(() => {
    void refresh();
  }, [from, to]);

  const onDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    setStatus("Deleting...");
    try {
      await deleteActivityLog(id);
      await refresh();
      setStatus("Deleted.");
      setTimeout(() => setStatus(""), 1000);
    } catch (e: any) {
      setStatus(`Delete failed: ${e?.message ?? String(e)}`);
    }
  };

  const Section = ({ title, rows }: { title: string; rows: any[] }) => (
    <div className="space-y-2">
      <h2 className="text-base font-medium">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-400">No entries yet.</p>
      ) : (
        rows.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div>
              <p className="text-sm font-semibold text-white">
                {Number(r.value).toFixed(1)} {r.unit}
              </p>
              <p className="text-xs text-neutral-400">{r.date}</p>
            </div>
            <button
              type="button"
              className="rounded-xl border border-white/10 bg-white/5 p-3 text-neutral-300 hover:bg-white/10"
              onClick={() => onDelete(r.id)}
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Cardio history</h1>
        <p className="text-sm text-neutral-400">Last 30 days</p>
        {status ? <p className="text-xs text-neutral-400">{status}</p> : null}
      </header>

      <Section title="Walking" rows={walking} />
      <Section title="Running" rows={running} />
    </div>
  );
}
