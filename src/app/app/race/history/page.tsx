"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, Trash2, ChevronDown, ChevronUp, Flag, Zap } from "lucide-react";
import Link from "next/link";
import { listActivityLogs, deleteActivityLog, type ActivityLogRow } from "@/lib/activity";
import { Toast, type ToastState } from "@/app/app/_components/ui";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { format, subDays, parseISO } from "date-fns";

interface RaceLogData {
  division: string;
  splits: Record<string, number>;
  totalSeconds: number;
}

interface TrainLogData {
  workout: string;
  workoutName: string;
}

const SEGMENT_LABELS: Record<string, { label: string; icon: string; type: "run" | "station" }> = {
  run1: { label: "Run 1", icon: "🏃", type: "run" },
  ski: { label: "SkiErg", icon: "⛷️", type: "station" },
  run2: { label: "Run 2", icon: "🏃", type: "run" },
  push: { label: "Sled Push", icon: "🛷", type: "station" },
  run3: { label: "Run 3", icon: "🏃", type: "run" },
  pull: { label: "Sled Pull", icon: "🪢", type: "station" },
  run4: { label: "Run 4", icon: "🏃", type: "run" },
  bbj: { label: "Burpee BJ", icon: "💥", type: "station" },
  run5: { label: "Run 5", icon: "🏃", type: "run" },
  row: { label: "Row", icon: "🚣", type: "station" },
  run6: { label: "Run 6", icon: "🏃", type: "run" },
  carry: { label: "Farmers Carry", icon: "🧑‍🌾", type: "station" },
  run7: { label: "Run 7", icon: "🏃", type: "run" },
  lunge: { label: "Lunges", icon: "🏋️", type: "station" },
  run8: { label: "Run 8", icon: "🏃", type: "run" },
  wall: { label: "Wall Balls", icon: "🎯", type: "station" },
};

const SEGMENT_ORDER = [
  "run1", "ski", "run2", "push", "run3", "pull", "run4", "bbj",
  "run5", "row", "run6", "carry", "run7", "lunge", "run8", "wall",
];

const DIVISION_LABELS: Record<string, string> = {
  open_m: "Open Men", open_f: "Open Women", pro_m: "Pro Men", pro_f: "Pro Women",
};

function fmtTime(sec: number): string {
  if (sec >= 3600) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;
}

function fmtDate(dateKey: string): string {
  try { return format(parseISO(dateKey), "EEE, MMM d"); } catch { return dateKey; }
}

function parseJSON<T>(notes: string | null): Partial<T> {
  if (!notes) return {};
  try { return JSON.parse(notes); } catch { return {}; }
}

type HistoryItem = {
  id: string; dateKey: string;
  kind: "race" | "train";
  race?: RaceLogData;
  train?: TrainLogData;
};

export default function RaceHistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<ToastState>("idle");
  const [filter, setFilter] = useState<"all" | "race" | "train">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const to = format(new Date(), "yyyy-MM-dd");
      const from = format(subDays(new Date(), 730), "yyyy-MM-dd");
      const [races, training] = await Promise.all([
        listActivityLogs({ from, to, activityKey: "race_log" as any }),
        listActivityLogs({ from, to, activityKey: "race_train" as any }),
      ]);
      const combined: HistoryItem[] = [
        ...races.map((r) => ({ id: r.id, dateKey: r.date, kind: "race" as const, race: parseJSON<RaceLogData>(r.notes) as RaceLogData })),
        ...training.map((r) => ({ id: r.id, dateKey: r.date, kind: "train" as const, train: parseJSON<TrainLogData>(r.notes) as TrainLogData })),
      ];
      combined.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
      setItems(combined);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleDelete = async (id: string) => {
    hapticMedium();
    setToast("saving");
    try {
      await deleteActivityLog(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setToast("saved");
      setTimeout(() => setToast("idle"), 1500);
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  const toggle = (id: string) => {
    hapticLight();
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.kind === filter);

  // Group by date
  const grouped = new Map<string, HistoryItem[]>();
  for (const item of filtered) {
    const arr = grouped.get(item.dateKey) || [];
    arr.push(item);
    grouped.set(item.dateKey, arr);
  }

  return (
    <div className="space-y-5">
      <Toast state={toast} />

      <div className="flex items-center gap-3">
        <Link href="/app/race" className="tap-btn rounded-full p-1.5" style={{ background: "var(--bg-card)" }}>
          <ChevronLeft size={20} style={{ color: "var(--text-muted)" }} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Race History</h1>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>Races and training sessions</p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {([
          { key: "all" as const, label: "All" },
          { key: "race" as const, label: "Races" },
          { key: "train" as const, label: "Training" },
        ]).map((f) => (
          <button key={f.key} type="button"
            onClick={() => { hapticLight(); setFilter(f.key); }}
            className="rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95"
            style={{
              background: filter === f.key ? "var(--btn-primary-bg)" : "var(--bg-card)",
              color: filter === f.key ? "var(--btn-primary-text)" : "var(--text-muted)",
              border: `1.5px solid ${filter === f.key ? "var(--btn-primary-bg)" : "var(--border-primary)"}`,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl p-4 skeleton" style={{ height: 72 }} />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-3xl mb-3">🏁</p>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>No entries yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>Log a race or training session to see it here</p>
        </div>
      )}

      {!loading && Array.from(grouped.entries()).map(([dateKey, dayItems]) => (
        <div key={dateKey}>
          <p className="text-[10px] font-bold tracking-wider uppercase mb-2 px-1"
            style={{ color: "var(--text-faint)" }}>
            {fmtDate(dateKey)}
          </p>
          <div className="space-y-2">
            {dayItems.map((item) => {
              const isOpen = expanded.has(item.id);
              const isRace = item.kind === "race" && item.race;
              const isTrain = item.kind === "train" && item.train;

              return (
                <div key={item.id} className="rounded-2xl overflow-hidden"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
                  <button type="button" onClick={() => toggle(item.id)}
                    className="w-full p-4 text-left flex items-center gap-3">
                    <div className="shrink-0 rounded-full flex items-center justify-center"
                      style={{
                        width: 36, height: 36,
                        background: isRace ? "var(--accent-green-soft)" : "var(--accent-blue-soft)",
                      }}>
                      {isRace ? <Flag size={16} style={{ color: "var(--accent-green)" }} />
                              : <Zap size={16} style={{ color: "var(--accent-blue)" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                        {isRace ? `Race — ${DIVISION_LABELS[item.race!.division] ?? "Open"}`
                                : isTrain ? item.train!.workoutName : "Unknown"}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {isRace && item.race!.totalSeconds ? fmtTime(item.race!.totalSeconds)
                                : isTrain ? "Training session" : ""}
                      </p>
                    </div>
                    <div className="shrink-0" style={{ color: "var(--text-faint)" }}>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-0" style={{ borderTop: "1px solid var(--border-primary)" }}>
                      {/* Race splits timeline */}
                      {isRace && item.race!.splits && (
                        <div className="pt-3 space-y-1">
                          {SEGMENT_ORDER.map((segId) => {
                            const sec = item.race!.splits[segId];
                            if (!sec) return null;
                            const meta = SEGMENT_LABELS[segId];
                            if (!meta) return null;
                            return (
                              <div key={segId} className="flex items-center gap-3 py-1">
                                <span className="text-xs shrink-0" style={{ width: 20, textAlign: "center" }}>{meta.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{meta.label}</p>
                                </div>
                                <p className="text-sm font-bold tabular-nums shrink-0"
                                  style={{ color: meta.type === "run" ? "var(--accent-green)" : "var(--accent-blue)" }}>
                                  {fmtTime(sec)}
                                </p>
                              </div>
                            );
                          })}

                          {/* Run vs station breakdown */}
                          <div className="mt-3 pt-3 grid grid-cols-2 gap-3" style={{ borderTop: "1px solid var(--border-primary)" }}>
                            <div className="text-center rounded-xl p-2.5" style={{ background: "var(--accent-green-soft)" }}>
                              <p className="text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>Total Runs</p>
                              <p className="text-base font-black tabular-nums mt-0.5" style={{ color: "var(--accent-green)" }}>
                                {fmtTime(Object.entries(item.race!.splits).filter(([k]) => k.startsWith("run")).reduce((s, [, v]) => s + v, 0))}
                              </p>
                            </div>
                            <div className="text-center rounded-xl p-2.5" style={{ background: "var(--accent-blue-soft)" }}>
                              <p className="text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>Total Stations</p>
                              <p className="text-base font-black tabular-nums mt-0.5" style={{ color: "var(--accent-blue)" }}>
                                {fmtTime(Object.entries(item.race!.splits).filter(([k]) => !k.startsWith("run")).reduce((s, [, v]) => s + v, 0))}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Delete */}
                      <div className="flex justify-end mt-3">
                        <button type="button" onClick={() => handleDelete(item.id)}
                          className="rounded-full p-2 transition-all active:scale-90"
                          style={{ background: "var(--accent-red-soft)" }}>
                          <Trash2 size={14} style={{ color: "var(--accent-red)" }} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
