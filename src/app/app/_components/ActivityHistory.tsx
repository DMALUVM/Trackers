"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, subDays } from "date-fns";
import { ArrowLeft, Trash2 } from "lucide-react";
import { listActivityLogs, deleteActivityLog, type ActivityKey, type ActivityLogRow } from "@/lib/activity";
import { SkeletonCard, Toast, type ToastState } from "@/app/app/_components/ui";

export interface ActivityHistoryProps {
  title: string;
  activityKey: ActivityKey;
  emoji: string;
  /** Number of days of history to show */
  days?: number;
}

export function ActivityHistory({ title, activityKey, emoji, days = 30 }: ActivityHistoryProps) {
  const router = useRouter();
  const [rows, setRows] = useState<ActivityLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>("idle");

  const load = async () => {
    setLoading(true);
    try {
      const to = format(new Date(), "yyyy-MM-dd");
      const from = format(subDays(new Date(), days), "yyyy-MM-dd");
      const data = await listActivityLogs({ from, to, activityKey });
      setRows(data);
    } catch {
      // stay empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [activityKey, days]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id: string) => {
    setToast("saving");
    try {
      await deleteActivityLog(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setToast("saved");
      setTimeout(() => setToast("idle"), 1500);
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  return (
    <div className="space-y-5">
      <Toast state={toast} />

      <header className="space-y-2">
        <button className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}
          onClick={() => router.back()} type="button">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {emoji} {title} History
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Last {days} days</p>
      </header>

      {loading ? (
        <SkeletonCard lines={5} />
      ) : rows.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No entries yet.</p>
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {rows.map((row) => (
            <div key={row.id} className="card-interactive px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {row.value.toLocaleString()} {row.unit}
                </p>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>{row.date}</p>
                {row.notes && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{row.notes}</p>
                )}
              </div>
              <button type="button" onClick={() => handleDelete(row.id)}
                className="p-2 rounded-lg" style={{ color: "var(--text-faint)" }}
                aria-label={`Delete ${row.value} ${row.unit} on ${row.date}`}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
