"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, subDays, parseISO } from "date-fns";
import { ArrowLeft, Trash2 } from "lucide-react";
import { listActivityLogs, deleteActivityLog, type ActivityKey, type ActivityLogRow } from "@/lib/activity";
import { SkeletonCard, Toast, EmptyState, type ToastState } from "@/app/app/_components/ui";
import { hapticLight, hapticMedium } from "@/lib/haptics";

export interface ActivityHistoryProps {
  title: string;
  activityKey: ActivityKey;
  emoji: string;
  days?: number;
}

export function ActivityHistory({ title, activityKey, emoji, days = 30 }: ActivityHistoryProps) {
  const router = useRouter();
  const [rows, setRows] = useState<ActivityLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>("idle");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const to = format(new Date(), "yyyy-MM-dd");
      const from = format(subDays(new Date(), days), "yyyy-MM-dd");
      setRows(await listActivityLogs({ from, to, activityKey }));
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [activityKey, days]); // eslint-disable-line

  const handleDelete = async (id: string) => {
    setConfirmId(null);
    setToast("saving");
    try {
      await deleteActivityLog(id);
      hapticMedium();
      setRows((prev) => prev.filter((r) => r.id !== id));
      setToast("saved");
      setTimeout(() => setToast("idle"), 1500);
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  // Group by date
  const grouped = rows.reduce<Record<string, ActivityLogRow[]>>((acc, row) => {
    (acc[row.date] ??= []).push(row);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Toast state={toast} />

      <header className="space-y-2">
        <button className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: "var(--text-muted)" }}
          onClick={() => { hapticLight(); router.back(); }} type="button">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {emoji} {title} History
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Last {days} days</p>
      </header>

      {loading ? (
        <SkeletonCard lines={5} />
      ) : rows.length === 0 ? (
        <EmptyState emoji="📭" title="No entries yet" description={`Log your first ${title.toLowerCase()} session to see history here.`} />
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, entries]) => (
            <section key={date}>
              <p className="text-xs font-bold tracking-wider uppercase mb-2 px-1" style={{ color: "var(--text-faint)" }}>
                {format(parseISO(date), "EEE, MMM d")}
              </p>
              <div className="space-y-1.5">
                {entries.map((row) => (
                  <div key={row.id} className="card-interactive px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                        {row.value.toLocaleString()} <span style={{ color: "var(--text-muted)" }}>{row.unit}</span>
                      </p>
                      {row.notes && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{row.notes}</p>}
                    </div>
                    {confirmId === row.id ? (
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => handleDelete(row.id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                          style={{ background: "var(--accent-red-soft)", color: "var(--accent-red-text)" }}>
                          Delete
                        </button>
                        <button type="button" onClick={() => setConfirmId(null)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                          style={{ background: "var(--bg-card-hover)", color: "var(--text-muted)" }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => { setConfirmId(row.id); hapticLight(); }}
                        className="p-2 rounded-lg transition-colors" style={{ color: "var(--text-faint)" }}
                        aria-label={`Delete ${row.value} ${row.unit}`}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
