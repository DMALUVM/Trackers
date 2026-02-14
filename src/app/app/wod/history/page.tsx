"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, Trash2, ChevronDown, ChevronUp, Trophy, Timer } from "lucide-react";
import Link from "next/link";
import { listActivityLogs, deleteActivityLog, type ActivityLogRow } from "@/lib/activity";
import { Toast, type ToastState } from "@/app/app/_components/ui";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { format, subDays, parseISO } from "date-fns";

interface PRData { lift: string; liftName: string; weight: number; unit: string; scheme: string; }
interface WODData { wod: string; wodName: string; type: "time" | "amrap"; timeSeconds?: number; rounds?: number; extraReps?: number; rx: boolean; }

function parseJSON<T>(notes: string | null): Partial<T> {
  if (!notes) return {};
  try { return JSON.parse(notes); } catch { return {}; }
}

function fmtTime(sec: number): string {
  if (sec >= 3600) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fmtDate(dateKey: string): string {
  try { return format(parseISO(dateKey), "EEE, MMM d"); } catch { return dateKey; }
}

type HistoryItem = { id: string; dateKey: string; kind: "pr" | "wod"; pr?: PRData; wod?: WODData };

export default function WODHistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<ToastState>("idle");
  const [filter, setFilter] = useState<"all" | "pr" | "wod">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const to = format(new Date(), "yyyy-MM-dd");
      const from = format(subDays(new Date(), 730), "yyyy-MM-dd");
      const [prs, wods] = await Promise.all([
        listActivityLogs({ from, to, activityKey: "pr" as any }),
        listActivityLogs({ from, to, activityKey: "wod" as any }),
      ]);
      const combined: HistoryItem[] = [
        ...prs.map((r) => ({ id: r.id, dateKey: r.date, kind: "pr" as const, pr: parseJSON<PRData>(r.notes) as PRData })),
        ...wods.map((r) => ({ id: r.id, dateKey: r.date, kind: "wod" as const, wod: parseJSON<WODData>(r.notes) as WODData })),
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
        <Link href="/app/wod" className="tap-btn rounded-full p-1.5" style={{ background: "var(--bg-card)" }}>
          <ChevronLeft size={20} style={{ color: "var(--text-muted)" }} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>History</h1>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>All PRs and benchmark results</p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {([
          { key: "all" as const, label: "All" },
          { key: "pr" as const, label: "PRs" },
          { key: "wod" as const, label: "WODs" },
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
          <p className="text-3xl mb-3">📋</p>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>No entries yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>Log a PR or WOD to see it here</p>
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
              const isPR = item.kind === "pr" && item.pr;
              const isWOD = item.kind === "wod" && item.wod;

              return (
                <div key={item.id} className="rounded-2xl overflow-hidden"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
                  <button type="button" onClick={() => toggle(item.id)}
                    className="w-full p-4 text-left flex items-center gap-3">
                    <div className="shrink-0 rounded-full flex items-center justify-center"
                      style={{
                        width: 36, height: 36,
                        background: isPR ? "var(--accent-yellow-soft)" : "var(--accent-blue-soft)",
                      }}>
                      {isPR ? <Trophy size={16} style={{ color: "var(--accent-yellow)" }} />
                             : <Timer size={16} style={{ color: "var(--accent-blue)" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                        {isPR ? item.pr!.liftName : isWOD ? item.wod!.wodName : "Unknown"}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {isPR
                          ? `${item.pr!.scheme}: ${item.pr!.scheme === "Max Reps" ? `${item.pr!.weight} reps` : `${item.pr!.weight} ${item.pr!.unit}`}`
                          : isWOD
                            ? item.wod!.type === "time" && item.wod!.timeSeconds
                              ? `${fmtTime(item.wod!.timeSeconds)}${item.wod!.rx === false ? " (Scaled)" : " Rx'd"}`
                              : `${item.wod!.rounds ?? 0}+${item.wod!.extraReps ?? 0}${item.wod!.rx === false ? " (Scaled)" : " Rx'd"}`
                            : ""}
                      </p>
                    </div>
                    <div className="shrink-0" style={{ color: "var(--text-faint)" }}>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-0 border-t" style={{ borderColor: "var(--border-primary)" }}>
                      <div className="flex items-center justify-between pt-3">
                        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                          {isPR ? `${item.pr!.liftName} · ${item.pr!.scheme}` : isWOD ? `${item.wod!.wodName} · ${item.wod!.type === "time" ? "For Time" : "AMRAP"}` : ""}
                        </p>
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
