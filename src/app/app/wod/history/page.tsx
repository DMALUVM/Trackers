"use client";

import { useEffect, useState } from "react";
import { format, subDays, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import { listActivityLogs, deleteActivityLog, type ActivityLogRow } from "@/lib/activity";
import { SkeletonCard, Toast, EmptyState, SubPageHeader, type ToastState } from "@/app/app/_components/ui";
import { hapticLight, hapticMedium } from "@/lib/haptics";

function fmtTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function parseNotes(notes: string | null): Record<string, any> {
  if (!notes) return {};
  try { return JSON.parse(notes); } catch { return {}; }
}

function PRRow({ row, onDelete }: { row: ActivityLogRow; onDelete: () => void }) {
  const data = parseNotes(row.notes);
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="card-interactive px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {data.liftName ?? "Lift"} — {data.scheme ?? ""}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
          {data.scheme === "Max Reps" ? `${data.weight} reps` : `${data.weight} ${data.unit ?? "lb"}`}
        </p>
      </div>
      {confirm ? (
        <div className="flex items-center gap-2">
          <button type="button" onClick={onDelete}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{ background: "var(--accent-red-soft)", color: "var(--accent-red-text)" }}>
            Delete
          </button>
          <button type="button" onClick={() => setConfirm(false)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{ background: "var(--bg-card-hover)", color: "var(--text-muted)" }}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => { setConfirm(true); hapticLight(); }}
          className="p-2 rounded-lg" style={{ color: "var(--text-faint)" }}>
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

function WODRow({ row, onDelete }: { row: ActivityLogRow; onDelete: () => void }) {
  const data = parseNotes(row.notes);
  const [confirm, setConfirm] = useState(false);
  const result = data.type === "time" && data.timeSeconds ? fmtTime(data.timeSeconds) : `${data.rounds ?? 0}+${data.extraReps ?? 0}`;

  return (
    <div className="card-interactive px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {data.wodName ?? "WOD"}
          {data.rx === false && <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--text-faint)" }}>(Scaled)</span>}
        </p>
        <p className="text-xs mt-0.5 tabular-nums" style={{ color: "var(--accent-primary)" }}>{result}</p>
      </div>
      {confirm ? (
        <div className="flex items-center gap-2">
          <button type="button" onClick={onDelete}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{ background: "var(--accent-red-soft)", color: "var(--accent-red-text)" }}>
            Delete
          </button>
          <button type="button" onClick={() => setConfirm(false)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{ background: "var(--bg-card-hover)", color: "var(--text-muted)" }}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => { setConfirm(true); hapticLight(); }}
          className="p-2 rounded-lg" style={{ color: "var(--text-faint)" }}>
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

export default function WODHistoryPage() {
  const [prRows, setPrRows] = useState<ActivityLogRow[]>([]);
  const [wodRows, setWodRows] = useState<ActivityLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>("idle");
  const [tab, setTab] = useState<"pr" | "wod">("pr");

  const load = async () => {
    setLoading(true);
    try {
      const to = format(new Date(), "yyyy-MM-dd");
      const from = format(subDays(new Date(), 365), "yyyy-MM-dd");
      const [prs, wods] = await Promise.all([
        listActivityLogs({ from, to, activityKey: "pr" as any }),
        listActivityLogs({ from, to, activityKey: "wod" as any }),
      ]);
      setPrRows(prs);
      setWodRows(wods);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const handleDelete = async (id: string, type: "pr" | "wod") => {
    setToast("saving");
    try {
      await deleteActivityLog(id);
      hapticMedium();
      if (type === "pr") setPrRows((prev) => prev.filter((r) => r.id !== id));
      else setWodRows((prev) => prev.filter((r) => r.id !== id));
      setToast("saved");
      setTimeout(() => setToast("idle"), 1500);
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  const rows = tab === "pr" ? prRows : wodRows;

  // Group by date
  const grouped = rows.reduce<Record<string, ActivityLogRow[]>>((acc, row) => {
    (acc[row.date] ??= []).push(row);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <Toast state={toast} />
      <SubPageHeader title="🏋️ Barbell & WODs" subtitle="History" backHref="/app/wod" />

      {/* Tab bar */}
      <div className="flex rounded-xl p-1" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
        {(["pr", "wod"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-center transition-all"
            style={{
              background: tab === t ? "var(--accent-primary)" : "transparent",
              color: tab === t ? "#fff" : "var(--text-muted)",
            }}
          >
            {t === "pr" ? "PRs" : "WODs"}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonCard lines={5} />
      ) : rows.length === 0 ? (
        <EmptyState emoji="📭" title="No entries yet" description={`Log your first ${tab === "pr" ? "PR" : "WOD"} to see history here.`} />
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, entries]) => (
            <section key={date}>
              <p className="text-xs font-bold tracking-wider uppercase mb-2 px-1" style={{ color: "var(--text-faint)" }}>
                {format(parseISO(date), "EEE, MMM d")}
              </p>
              <div className="space-y-1.5">
                {entries.map((row) => (
                  tab === "pr"
                    ? <PRRow key={row.id} row={row} onDelete={() => handleDelete(row.id, "pr")} />
                    : <WODRow key={row.id} row={row} onDelete={() => handleDelete(row.id, "wod")} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
