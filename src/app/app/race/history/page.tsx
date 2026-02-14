"use client";

import { useEffect, useState } from "react";
import { format, subDays, parseISO } from "date-fns";
import { Trash2, ChevronDown } from "lucide-react";
import { listActivityLogs, deleteActivityLog, type ActivityLogRow } from "@/lib/activity";
import { SkeletonCard, Toast, EmptyState, SubPageHeader, type ToastState } from "@/app/app/_components/ui";
import { hapticLight, hapticMedium } from "@/lib/haptics";

const STATIONS = [
  { id: "skierg", name: "SkiErg", emoji: "⛷️" },
  { id: "sled_push", name: "Sled Push", emoji: "🛷" },
  { id: "sled_pull", name: "Sled Pull", emoji: "🪢" },
  { id: "burpee_broad_jump", name: "Burpee Broad Jump", emoji: "🐸" },
  { id: "row", name: "Row", emoji: "🚣" },
  { id: "farmers_carry", name: "Farmers Carry", emoji: "🏋️" },
  { id: "sandbag_lunges", name: "Sandbag Lunges", emoji: "🏃" },
  { id: "wall_balls", name: "Wall Balls", emoji: "🎯" },
];

const DIVISIONS: Record<string, string> = {
  open_m: "Open (M)",
  open_f: "Open (F)",
  pro_m: "Pro (M)",
  pro_f: "Pro (F)",
};

function fmtTime(totalSec: number): string {
  if (totalSec >= 3600) {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function parseNotes(notes: string | null): Record<string, any> {
  if (!notes) return {};
  try { return JSON.parse(notes); } catch { return {}; }
}

function RaceRow({ row, onDelete }: { row: ActivityLogRow; onDelete: () => void }) {
  const data = parseNotes(row.notes);
  const [confirm, setConfirm] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const runs: (number | null)[] = data.runs ?? [];
  const stations: (number | null)[] = data.stations ?? [];

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between">
        <button type="button" onClick={() => setExpanded(!expanded)} className="flex-1 text-left flex items-center gap-3">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {DIVISIONS[data.division] ?? "Race"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>{row.date}</p>
          </div>
          <div className="flex-1" />
          <p className="text-lg font-bold tabular-nums mr-2" style={{ color: "var(--accent-primary)" }}>
            {data.totalSeconds ? fmtTime(data.totalSeconds) : row.value}
          </p>
          <ChevronDown
            size={14}
            style={{
              color: "var(--text-faint)",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        </button>
        {confirm ? (
          <div className="flex items-center gap-2 ml-2">
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
            className="p-2 rounded-lg ml-1" style={{ color: "var(--text-faint)" }}>
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-3 space-y-1" style={{ borderTop: "1px solid var(--border-primary)" }}>
          {STATIONS.map((station, i) => (
            <div key={station.id}>
              {runs[i] != null && (
                <div className="flex items-center justify-between py-1.5">
                  <p className="text-xs" style={{ color: "var(--text-faint)" }}>🏃 Run {i + 1}</p>
                  <p className="text-xs font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>
                    {fmtTime(runs[i]!)}
                  </p>
                </div>
              )}
              {stations[i] != null && (
                <div className="flex items-center justify-between py-1.5" style={{ borderBottom: i < 7 ? "1px solid var(--border-primary)" : "none" }}>
                  <p className="text-xs" style={{ color: "var(--text-primary)" }}>{station.emoji} {station.name}</p>
                  <p className="text-xs font-semibold tabular-nums" style={{ color: "var(--accent-primary)" }}>
                    {fmtTime(stations[i]!)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrainRow({ row, onDelete }: { row: ActivityLogRow; onDelete: () => void }) {
  const data = parseNotes(row.notes);
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="card-interactive px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{data.workoutName ?? "Training"}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{data.focus ?? ""} — {row.value} min</p>
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

export default function RaceHistoryPage() {
  const [raceRows, setRaceRows] = useState<ActivityLogRow[]>([]);
  const [trainRows, setTrainRows] = useState<ActivityLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>("idle");
  const [tab, setTab] = useState<"race" | "training">("race");

  const load = async () => {
    setLoading(true);
    try {
      const to = format(new Date(), "yyyy-MM-dd");
      const from = format(subDays(new Date(), 365), "yyyy-MM-dd");
      const [races, trains] = await Promise.all([
        listActivityLogs({ from, to, activityKey: "race_log" as any }),
        listActivityLogs({ from, to, activityKey: "race_train" as any }),
      ]);
      setRaceRows(races);
      setTrainRows(trains);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const handleDelete = async (id: string, type: "race" | "training") => {
    setToast("saving");
    try {
      await deleteActivityLog(id);
      hapticMedium();
      if (type === "race") setRaceRows((prev) => prev.filter((r) => r.id !== id));
      else setTrainRows((prev) => prev.filter((r) => r.id !== id));
      setToast("saved");
      setTimeout(() => setToast("idle"), 1500);
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  const rows = tab === "race" ? raceRows : trainRows;

  // Group by date
  const grouped = rows.reduce<Record<string, ActivityLogRow[]>>((acc, row) => {
    (acc[row.date] ??= []).push(row);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <Toast state={toast} />
      <SubPageHeader title="🏁 Hybrid Race" subtitle="History" backHref="/app/race" />

      {/* Tab bar */}
      <div className="flex rounded-xl p-1" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
        {(["race", "training"] as const).map((t) => (
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
            {t === "race" ? "Races" : "Training"}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonCard lines={5} />
      ) : rows.length === 0 ? (
        <EmptyState emoji="📭" title="No entries yet" description={`Log your first ${tab === "race" ? "race" : "training workout"} to see history here.`} />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, entries]) => (
            <section key={date}>
              <p className="text-xs font-bold tracking-wider uppercase mb-2 px-1" style={{ color: "var(--text-faint)" }}>
                {format(parseISO(date), "EEE, MMM d")}
              </p>
              <div className="space-y-2">
                {entries.map((row) => (
                  tab === "race"
                    ? <RaceRow key={row.id} row={row} onDelete={() => handleDelete(row.id, "race")} />
                    : <TrainRow key={row.id} row={row} onDelete={() => handleDelete(row.id, "training")} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
