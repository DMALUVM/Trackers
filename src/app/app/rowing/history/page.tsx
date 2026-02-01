"use client";

import { useEffect, useMemo, useState } from "react";
import { subDays, format } from "date-fns";
import { Trash2 } from "lucide-react";
import { deleteActivityLog, listActivityLogs } from "@/lib/activity";

export default function RowingHistoryPage() {
  const now = useMemo(() => new Date(), []);
  const from = useMemo(() => format(subDays(now, 30), "yyyy-MM-dd"), [now]);
  const to = useMemo(() => format(now, "yyyy-MM-dd"), [now]);

  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState<string>("");

  const refresh = async () => {
    const data = await listActivityLogs({ from, to, activityKey: "rowing" });
    setRows(data);
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

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Rowing history</h1>
        <p className="text-sm text-neutral-400">Last 30 days</p>
        {status ? <p className="text-xs text-neutral-400">{status}</p> : null}
      </header>

      <section className="space-y-2">
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
                  {Number(r.value).toLocaleString()} {r.unit}
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
      </section>
    </div>
  );
}
