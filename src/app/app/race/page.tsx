"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { History, Check, ChevronDown, ChevronUp, Flag, Zap, Timer, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useToday } from "@/lib/hooks";
import { addActivityLog, deleteActivityLog, listActivityLogs, type ActivityLogRow } from "@/lib/activity";
import { Toast, BottomSheet, type ToastState } from "@/app/app/_components/ui";
import { hapticSuccess, hapticLight, hapticMedium, hapticHeavy, hapticSelection } from "@/lib/haptics";
import { format, subDays } from "date-fns";

// ═══════════════════════════════════════════════
// Race Format — 8 stations + 8 runs
// ═══════════════════════════════════════════════

interface RaceSegment {
  id: string;
  label: string;
  detail: string;
  type: "run" | "station";
  icon: string;
  color: string;
}

const SEGMENTS: RaceSegment[] = [
  { id: "run1",  label: "Run 1",         detail: "1 km",         type: "run",     icon: "🏃", color: "var(--accent-green)" },
  { id: "ski",   label: "SkiErg",        detail: "1,000 m",      type: "station", icon: "⛷️", color: "var(--accent-blue)" },
  { id: "run2",  label: "Run 2",         detail: "1 km",         type: "run",     icon: "🏃", color: "var(--accent-green)" },
  { id: "push",  label: "Sled Push",     detail: "50 m",         type: "station", icon: "🛷", color: "var(--accent-blue)" },
  { id: "run3",  label: "Run 3",         detail: "1 km",         type: "run",     icon: "🏃", color: "var(--accent-green)" },
  { id: "pull",  label: "Sled Pull",     detail: "50 m",         type: "station", icon: "🪢", color: "var(--accent-blue)" },
  { id: "run4",  label: "Run 4",         detail: "1 km",         type: "run",     icon: "🏃", color: "var(--accent-green)" },
  { id: "bbj",   label: "Burpee BJ",     detail: "80 m",         type: "station", icon: "💥", color: "var(--accent-blue)" },
  { id: "run5",  label: "Run 5",         detail: "1 km",         type: "run",     icon: "🏃", color: "var(--accent-green)" },
  { id: "row",   label: "Row",           detail: "1,000 m",      type: "station", icon: "🚣", color: "var(--accent-blue)" },
  { id: "run6",  label: "Run 6",         detail: "1 km",         type: "run",     icon: "🏃", color: "var(--accent-green)" },
  { id: "carry", label: "Farmers Carry", detail: "200 m",        type: "station", icon: "🧑‍🌾", color: "var(--accent-blue)" },
  { id: "run7",  label: "Run 7",         detail: "1 km",         type: "run",     icon: "🏃", color: "var(--accent-green)" },
  { id: "lunge", label: "Lunges",        detail: "100 m",        type: "station", icon: "🏋️", color: "var(--accent-blue)" },
  { id: "run8",  label: "Run 8",         detail: "1 km",         type: "run",     icon: "🏃", color: "var(--accent-green)" },
  { id: "wall",  label: "Wall Balls",    detail: "75–100 reps",  type: "station", icon: "🎯", color: "var(--accent-blue)" },
];

const STATIONS_ONLY = SEGMENTS.filter((s) => s.type === "station");
const RUNS_ONLY = SEGMENTS.filter((s) => s.type === "run");

type Division = "open_m" | "open_f" | "pro_m" | "pro_f";

const DIVISIONS: { key: Division; label: string; short: string }[] = [
  { key: "open_m", label: "Open Men",   short: "Open M" },
  { key: "open_f", label: "Open Women", short: "Open W" },
  { key: "pro_m",  label: "Pro Men",    short: "Pro M" },
  { key: "pro_f",  label: "Pro Women",  short: "Pro W" },
];

// ═══════════════════════════════════════════════
// Station Training — matches exact race stations
// ═══════════════════════════════════════════════

interface StationDrill {
  id: string;
  stationId: string;
  name: string;
  icon: string;
  rxStandard: string;
  drills: string[];
  duration: string;
}

const STATION_DRILLS: StationDrill[] = [
  {
    id: "drill_ski", stationId: "ski", name: "SkiErg", icon: "⛷️",
    rxStandard: "1,000m SkiErg",
    drills: ["4 × 500m SkiErg (90s rest)", "2 × 1,000m SkiErg (2 min rest)", "6 × 250m sprints (60s rest)"],
    duration: "20–30 min",
  },
  {
    id: "drill_push", stationId: "push", name: "Sled Push", icon: "🛷",
    rxStandard: "50m Sled Push (race weight)",
    drills: ["6 × 25m Sled Push (heavy)", "3 × 50m Sled Push at race weight", "4 × 50m Sled Push (build weight each set)"],
    duration: "15–25 min",
  },
  {
    id: "drill_pull", stationId: "pull", name: "Sled Pull", icon: "🪢",
    rxStandard: "50m Sled Pull (race weight)",
    drills: ["6 × 25m Sled Pull (heavy)", "3 × 50m Sled Pull at race weight", "50m Push + 50m Pull combo × 3"],
    duration: "15–25 min",
  },
  {
    id: "drill_bbj", stationId: "bbj", name: "Burpee Broad Jump", icon: "💥",
    rxStandard: "80m Burpee Broad Jumps",
    drills: ["5 × 20m Burpee Broad Jumps", "10 Burpees + 20m BBJ × 4 rounds", "80m BBJ time trial"],
    duration: "15–20 min",
  },
  {
    id: "drill_row", stationId: "row", name: "Row", icon: "🚣",
    rxStandard: "1,000m Row",
    drills: ["4 × 500m Row (90s rest)", "2 × 1,000m Row (2 min rest)", "8 × 250m Row sprints (45s rest)"],
    duration: "20–30 min",
  },
  {
    id: "drill_carry", stationId: "carry", name: "Farmers Carry", icon: "🧑‍🌾",
    rxStandard: "200m Farmers Carry (race weight)",
    drills: ["4 × 100m Farmers Carry (race weight)", "2 × 200m Farmers Carry (time trial)", "6 × 50m Farmers Carry (heavy)"],
    duration: "15–20 min",
  },
  {
    id: "drill_lunge", stationId: "lunge", name: "Lunges", icon: "🏋️",
    rxStandard: "100m Walking Lunges",
    drills: ["4 × 50m Sandbag Lunges", "2 × 100m Walking Lunges (time trial)", "3 × 25m Overhead Lunges + 25m Front Rack Lunges"],
    duration: "15–20 min",
  },
  {
    id: "drill_wall", stationId: "wall", name: "Wall Balls", icon: "🎯",
    rxStandard: "75–100 Wall Balls (20/14 lb)",
    drills: ["5 × 20 Wall Balls (30s rest)", "3 × 30 Wall Balls (60s rest)", "100 Wall Balls for time"],
    duration: "15–20 min",
  },
];

// ═══════════════════════════════════════════════
// General Training Workouts (multi-station combos)
// ═══════════════════════════════════════════════

interface GeneralWorkout {
  id: string;
  name: string;
  focus: string;
  emoji: string;
  stations: string[];
  exercises: string[];
  duration: string;
}

const GENERAL_WORKOUTS: GeneralWorkout[] = [
  {
    id: "erg_endurance", name: "Erg Endurance", focus: "Aerobic Base",
    emoji: "⛷️", stations: ["SkiErg", "Row"],
    exercises: ["4 × 500m SkiErg (90s rest)", "4 × 500m Row (90s rest)", "2 × 1000m alternating (2min rest)"],
    duration: "35 min",
  },
  {
    id: "sled_power", name: "Sled Power", focus: "Strength Endurance",
    emoji: "🛷", stations: ["Sled Push", "Sled Pull"],
    exercises: ["6 × 25m Sled Push (heavy)", "6 × 25m Sled Pull (heavy)", "3 × 50m Push-Pull combo (race weight)"],
    duration: "25 min",
  },
  {
    id: "carry_lunge", name: "Carry & Lunge Grind", focus: "Lower Body",
    emoji: "🏋️", stations: ["Farmers Carry", "Lunges"],
    exercises: ["4 × 100m Farmers Carry (race weight)", "4 × 50m Sandbag Lunges", "2 × 200m Carry + 100m Lunge combo"],
    duration: "30 min",
  },
  {
    id: "wall_ball_blast", name: "Wall Ball Blast", focus: "Stamina",
    emoji: "🎯", stations: ["Wall Balls"],
    exercises: ["5 × 20 Wall Balls (30s rest)", "3 × 30 Wall Balls (60s rest)", "1 × 75 Wall Balls (time trial)"],
    duration: "20 min",
  },
  {
    id: "bbj_condition", name: "BBJ Conditioning", focus: "Full Body",
    emoji: "💥", stations: ["Burpee BJ"],
    exercises: ["5 × 20m Burpee Broad Jumps", "10 Burpees + 20m BBJ × 4 rounds", "80m BBJ time trial"],
    duration: "20 min",
  },
  {
    id: "running_base", name: "Running Base Builder", focus: "Cardio",
    emoji: "🏃", stations: ["Running"],
    exercises: ["8 × 1km intervals (target: race pace)", "Rest 60s between intervals", "Final km: all-out effort"],
    duration: "45 min",
  },
  {
    id: "station_sandwich", name: "Station Sandwich", focus: "Transitions",
    emoji: "🥪", stations: ["Mixed"],
    exercises: ["1km Run → 500m SkiErg → 1km Run", "1km Run → 25m Sled Push → 25m Sled Pull → 1km Run", "1km Run → 50 Wall Balls → 1km Run"],
    duration: "40 min",
  },
  {
    id: "full_sim", name: "Full Race Simulation", focus: "Race Prep",
    emoji: "🏁", stations: ["All Stations"],
    exercises: ["Complete all 8 runs (1km each)", "All 8 stations at race standards", "Record total time and splits"],
    duration: "60–90 min",
  },
];

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

function fmtTime(sec: number): string {
  if (sec >= 3600) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;
}

function parseTimeStr(str: string): number | null {
  if (!str.trim()) return null;
  const hms = str.match(/^(\d+):(\d{1,2}):(\d{1,2})$/);
  if (hms) return parseInt(hms[1]) * 3600 + parseInt(hms[2]) * 60 + parseInt(hms[3]);
  const ms = str.match(/^(\d+):(\d{1,2})$/);
  if (ms) return parseInt(ms[1]) * 60 + parseInt(ms[2]);
  const n = parseInt(str);
  return !isNaN(n) && n > 0 ? n : null;
}

interface RaceLogData { division: Division; splits: Record<string, number>; totalSeconds: number; }
interface TrainLogData { workout: string; workoutName: string; rx?: boolean; stationId?: string; mode?: "time_trial" | "drill"; timeSeconds?: number; }

function parseJSON<T>(notes: string | null): Partial<T> {
  if (!notes) return {};
  try { return JSON.parse(notes); } catch { return {}; }
}

// ═══════════════════════════════════════════════
// Tab Bar
// ═══════════════════════════════════════════════

function TabBar({ active, tabs, onChange }: {
  active: string; tabs: { key: string; label: string }[]; onChange: (k: string) => void;
}) {
  return (
    <div className="flex rounded-2xl p-1" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
      {tabs.map((t) => (
        <button key={t.key} type="button"
          onClick={() => { hapticSelection(); onChange(t.key); }}
          className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-center transition-all duration-200"
          style={{
            background: active === t.key ? "var(--btn-primary-bg)" : "transparent",
            color: active === t.key ? "var(--btn-primary-text)" : "var(--text-muted)",
          }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Race Log Tab — Polished split entry
// ═══════════════════════════════════════════════

function RaceLogTab({ allRaces, reload }: { allRaces: ActivityLogRow[]; reload: () => void }) {
  const { dateKey } = useToday();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [division, setDivision] = useState<Division>("open_m");
  const [splits, setSplits] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<ToastState>("idle");
  const [justSaved, setJustSaved] = useState(false);
  const [splitView, setSplitView] = useState<"stations" | "runs">("stations");
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Body scroll lock + Escape key for overlay
  useEffect(() => {
    if (!sheetOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSheetOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); };
  }, [sheetOpen]);

  const bestRace = useMemo(() => {
    let best: RaceLogData | null = null;
    for (const row of allRaces) {
      const d = parseJSON<RaceLogData>(row.notes);
      if (!d.totalSeconds) continue;
      if (!best || d.totalSeconds < best.totalSeconds) best = d as RaceLogData;
    }
    return best;
  }, [allRaces]);

  const openSheet = () => {
    hapticMedium();
    setSheetOpen(true);
    setSplits({});
    setJustSaved(false);
    setSplitView("stations");
  };

  const updateSplit = (segId: string, val: string) => {
    setSplits((prev) => ({ ...prev, [segId]: val }));
    setJustSaved(false);
  };

  const handleKeyDown = (segId: string, segs: RaceSegment[], e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const idx = segs.findIndex((s) => s.id === segId);
      if (idx < segs.length - 1) {
        inputRefs.current[segs[idx + 1].id]?.focus();
      } else {
        (e.target as HTMLInputElement).blur();
      }
    }
  };

  // Calculate total from all filled
  const parsedSplits: Record<string, number> = {};
  let totalSeconds = 0;
  let filledCount = 0;
  for (const seg of SEGMENTS) {
    const parsed = parseTimeStr(splits[seg.id] ?? "");
    if (parsed !== null) {
      parsedSplits[seg.id] = parsed;
      totalSeconds += parsed;
      filledCount++;
    }
  }

  const handleSave = async () => {
    if (filledCount === 0) return;
    setToast("saving");
    try {
      const notes: RaceLogData = { division, splits: parsedSplits, totalSeconds };
      await addActivityLog({
        dateKey, activityKey: "race_log" as any, value: totalSeconds, unit: "count" as any,
        notes: JSON.stringify(notes),
      });
      hapticHeavy(); setJustSaved(true); setToast("saved"); reload();
      setTimeout(() => { setToast("idle"); setSheetOpen(false); }, 1200);
    } catch { setToast("error"); setTimeout(() => setToast("idle"), 3000); }
  };

  const visibleSegs = splitView === "stations" ? STATIONS_ONLY : RUNS_ONLY;

  return (
    <>
      <Toast state={toast} />

      {/* Best Race Summary */}
      {bestRace && (
        <div className="rounded-2xl p-5"
          style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.06))", border: "1px solid rgba(16,185,129,0.2)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Flag size={14} style={{ color: "var(--accent-green)" }} />
            <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>Personal Best</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black tabular-nums" style={{ color: "var(--accent-green)" }}>
              {fmtTime(bestRace.totalSeconds)}
            </p>
            <p className="text-xs font-semibold" style={{ color: "var(--text-faint)" }}>
              {DIVISIONS.find((d) => d.key === bestRace.division)?.short ?? ""}
            </p>
          </div>
          <div className="flex gap-4 mt-3">
            <div>
              <p className="text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>Runs</p>
              <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {fmtTime(Object.entries(bestRace.splits).filter(([k]) => k.startsWith("run")).reduce((s, [, v]) => s + v, 0))}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>Stations</p>
              <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {fmtTime(Object.entries(bestRace.splits).filter(([k]) => !k.startsWith("run")).reduce((s, [, v]) => s + v, 0))}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>Segments</p>
              <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {Object.keys(bestRace.splits).length}/16
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Log Race CTA */}
      <button type="button" onClick={openSheet}
        className="w-full rounded-2xl p-5 text-center transition-all active:scale-[0.98]"
        style={{ background: "var(--accent-green)", boxShadow: "0 4px 24px rgba(16,185,129,0.3)" }}>
        <div className="flex items-center justify-center gap-3">
          <Flag size={22} style={{ color: "var(--text-inverse)" }} />
          <p className="text-base font-bold" style={{ color: "var(--text-inverse)" }}>Log Race Result</p>
        </div>
        <p className="text-xs mt-1 font-medium" style={{ color: "var(--text-inverse)", opacity: 0.8 }}>
          Enter your split times for each segment
        </p>
      </button>

      {/* Recent Races */}
      {allRaces.length > 0 && (
        <div>
          <p className="text-[10px] font-bold tracking-wider uppercase mb-2 px-1" style={{ color: "var(--text-faint)" }}>Recent Races</p>
          <div className="space-y-2">
            {allRaces.slice(0, 5).map((row) => {
              const d = parseJSON<RaceLogData>(row.notes);
              if (!d.totalSeconds) return null;
              const div = DIVISIONS.find((dv) => dv.key === d.division);
              return (
                <div key={row.id} className="rounded-2xl p-4 flex items-center justify-between"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {format(new Date(row.date), "MMM d, yyyy")}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{div?.label ?? "Open"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black tabular-nums" style={{ color: "var(--accent-green)" }}>
                      {fmtTime(d.totalSeconds)}
                    </p>
                    <p className="text-[10px] font-semibold" style={{ color: "var(--text-faint)" }}>
                      {Object.keys(d.splits ?? {}).length}/16 splits
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Race Entry Full-Screen Overlay — no drag conflict ── */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSheetOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 w-full max-w-md mx-auto flex flex-col rounded-t-2xl"
            style={{
              background: "var(--bg-sheet)",
              border: "1px solid var(--border-primary)",
              borderBottom: "none",
              maxHeight: "92vh",
              animation: "slide-up 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed header — drag handle + title + done */}
            <div className="shrink-0 px-4 pt-3 pb-2">
              <div className="flex justify-center mb-2">
                <div className="h-1.5 w-10 rounded-full" style={{ background: "var(--border-primary)" }} />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Log Race</h3>
                <button type="button" onClick={() => setSheetOpen(false)}
                  className="rounded-full px-3.5 py-2 text-xs font-semibold"
                  style={{ background: "var(--bg-card-hover)", color: "var(--text-muted)" }}>
                  Done
                </button>
              </div>
            </div>

            {/* Scrollable content — free scroll, no drag interference */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4"
              style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))", WebkitOverflowScrolling: "touch" as any }}>
              <div className="space-y-4">
                {/* Division selector */}
                <div>
                  <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>Division</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {DIVISIONS.map((d) => (
                      <button key={d.key} type="button"
                        onClick={() => { hapticLight(); setDivision(d.key); }}
                        className="rounded-xl py-2 text-[11px] font-bold text-center transition-all active:scale-95"
                        style={{
                          background: division === d.key ? "var(--btn-primary-bg)" : "var(--bg-card)",
                          color: division === d.key ? "var(--btn-primary-text)" : "var(--text-muted)",
                          border: `1.5px solid ${division === d.key ? "var(--btn-primary-bg)" : "var(--border-primary)"}`,
                        }}>
                        {d.short}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stations / Runs toggle */}
                <div className="flex rounded-xl p-0.5" style={{ background: "var(--bg-card-hover)" }}>
                  {(["stations", "runs"] as const).map((v) => (
                    <button key={v} type="button"
                      onClick={() => { hapticLight(); setSplitView(v); }}
                      className="flex-1 rounded-lg py-2 text-xs font-bold text-center transition-all"
                      style={{
                        background: splitView === v ? "var(--bg-card)" : "transparent",
                        color: splitView === v ? "var(--text-primary)" : "var(--text-faint)",
                        boxShadow: splitView === v ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                      }}>
                      {v === "stations" ? `Stations (${STATIONS_ONLY.filter((s) => parsedSplits[s.id]).length}/8)` : `Runs (${RUNS_ONLY.filter((s) => parsedSplits[s.id]).length}/8)`}
                    </button>
                  ))}
                </div>

                {/* Split inputs — scrolls freely now */}
                <div className="space-y-1.5">
                  {visibleSegs.map((seg) => (
                    <div key={seg.id} className="flex items-center gap-2 rounded-xl px-3 py-2"
                      style={{ background: parsedSplits[seg.id] ? (seg.type === "station" ? "var(--accent-blue-soft)" : "var(--accent-green-soft)") : "var(--bg-card)" }}>
                      <span className="text-base shrink-0">{seg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>{seg.label}</p>
                        <p className="text-[10px] -mt-0.5" style={{ color: "var(--text-faint)" }}>{seg.detail}</p>
                      </div>
                      <input
                        ref={(el) => { inputRefs.current[seg.id] = el; }}
                        className="shrink-0 rounded-lg px-2.5 py-2 text-right text-sm font-bold tabular-nums"
                        style={{
                          width: 78,
                          background: "var(--bg-input)",
                          border: `1.5px solid ${parsedSplits[seg.id] ? seg.color : "var(--border-primary)"}`,
                          color: "var(--text-primary)",
                        }}
                        placeholder="0:00"
                        inputMode="text"
                        value={splits[seg.id] ?? ""}
                        onChange={(e) => updateSplit(seg.id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(seg.id, visibleSegs, e)}
                      />
                    </div>
                  ))}
                </div>

                {/* Total */}
                {filledCount > 0 && (
                  <div className="rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{ background: "var(--accent-green-soft)", border: "1px solid var(--accent-green)" }}>
                    <div>
                      <p className="text-xs font-bold" style={{ color: "var(--accent-green)" }}>Total Time</p>
                      <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>{filledCount}/16 segments entered</p>
                    </div>
                    <p className="text-xl font-black tabular-nums" style={{ color: "var(--accent-green)" }}>
                      {fmtTime(totalSeconds)}
                    </p>
                  </div>
                )}

                {/* Save */}
                <button type="button" onClick={handleSave}
                  disabled={filledCount === 0 || justSaved}
                  className="btn-primary w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2"
                  style={(filledCount === 0 || justSaved) ? { opacity: 0.5 } : {}}>
                  {justSaved
                    ? <><Check size={18} /> Race Logged!</>
                    : <><Flag size={18} /> Save Race ({filledCount}/16 splits)</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════
// Station Training Tab — exact race stations w/ Rx
// ═══════════════════════════════════════════════

function TrainingTab({ allTraining, reload }: { allTraining: ActivityLogRow[]; reload: () => void }) {
  const { dateKey } = useToday();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>("idle");
  const [logSheet, setLogSheet] = useState<StationDrill | null>(null);
  const [logMode, setLogMode] = useState<"time_trial" | "drill">("drill");
  const [rxToggle, setRxToggle] = useState(true);
  const [timeInput, setTimeInput] = useState("");

  const todayDone = useMemo(() => {
    const map = new Map<string, TrainLogData & { _rowId: string }>();
    for (const row of allTraining) {
      if (row.date !== dateKey) continue;
      const d = parseJSON<TrainLogData>(row.notes);
      if (d.workout) map.set(d.workout, { ...(d as TrainLogData), _rowId: row.id });
    }
    return map;
  }, [allTraining, dateKey]);

  // Best Rx time trials per station
  const bestTrials = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of allTraining) {
      const d = parseJSON<TrainLogData>(row.notes);
      if (d.mode !== "time_trial" || !d.stationId || !d.timeSeconds) continue;
      const prev = map.get(d.stationId);
      if (!prev || d.timeSeconds < prev) map.set(d.stationId, d.timeSeconds);
    }
    return map;
  }, [allTraining]);

  const toggle = (id: string) => {
    hapticLight();
    setExpanded((prev) => prev === id ? null : id);
  };

  const openLogSheet = (drill: StationDrill, mode: "time_trial" | "drill") => {
    hapticMedium();
    setLogSheet(drill);
    setLogMode(mode);
    setRxToggle(true);
    setTimeInput("");
  };

  const handleLog = async () => {
    if (!logSheet) return;
    const parsedTime = parseTimeStr(timeInput);
    if (logMode === "time_trial" && !parsedTime) return;
    setToast("saving");
    try {
      const notes: TrainLogData = {
        workout: logMode === "time_trial" ? `rx_${logSheet.stationId}` : logSheet.id,
        workoutName: logMode === "time_trial" ? `${logSheet.name} Rx Trial` : logSheet.name,
        rx: rxToggle, stationId: logSheet.stationId, mode: logMode,
        ...(logMode === "time_trial" && parsedTime ? { timeSeconds: parsedTime } : {}),
      };
      await addActivityLog({
        dateKey, activityKey: "race_train" as any, value: parsedTime ?? 1, unit: "count" as any,
        notes: JSON.stringify(notes),
      });
      hapticSuccess(); setToast("saved"); setLogSheet(null); reload();
      setTimeout(() => setToast("idle"), 1500);
    } catch { setToast("error"); setTimeout(() => setToast("idle"), 3000); }
  };

  return (
    <>
      <Toast state={toast} />

      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Train each station exactly as it appears in the race. Log Rx when you hit race standards.
      </p>

      <div className="space-y-3">
        {STATION_DRILLS.map((drill) => {
          const isOpen = expanded === drill.id;
          const doneData = todayDone.get(drill.id);
          const done = !!doneData;

          return (
            <div key={drill.id} className="rounded-2xl overflow-hidden transition-all"
              style={{
                background: done ? "var(--accent-green-soft)" : "var(--bg-card)",
                border: `1px solid ${done ? "var(--accent-green)" : "var(--border-primary)"}`,
              }}>
              <button type="button" onClick={() => toggle(drill.id)}
                className="w-full p-4 text-left flex items-center gap-3">
                <span className="text-2xl shrink-0">{drill.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{drill.name}</p>
                    {done && <Check size={14} style={{ color: "var(--accent-green)" }} />}
                    {doneData?.rx && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded"
                        style={{ background: "var(--accent-green)", color: "white" }}>Rx</span>
                    )}
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Rx: {drill.rxStandard}
                  </p>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "var(--bg-card-hover)", color: "var(--text-faint)" }}>
                      {drill.duration}
                    </span>
                    {bestTrials.get(drill.stationId) && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "var(--accent-blue-soft)", color: "var(--accent-blue)" }}>
                        Best: {fmtTime(bestTrials.get(drill.stationId)!)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0" style={{ color: "var(--text-faint)" }}>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-0 space-y-3" style={{ borderTop: "1px solid var(--border-primary)" }}>
                  {/* Rx Time Trial */}
                  <div className="pt-3">
                    <button type="button" onClick={() => openLogSheet(drill, "time_trial")}
                      className="w-full rounded-xl p-3.5 text-left flex items-center gap-3 transition-all active:scale-[0.98]"
                      style={{ background: "var(--accent-blue-soft)", border: "1.5px solid var(--accent-blue)" }}>
                      <Timer size={20} style={{ color: "var(--accent-blue)" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: "var(--accent-blue)" }}>Rx Time Trial</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {drill.rxStandard} — log your time
                        </p>
                      </div>
                      {bestTrials.get(drill.stationId) && (
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-black tabular-nums" style={{ color: "var(--accent-blue)" }}>
                            {fmtTime(bestTrials.get(drill.stationId)!)}
                          </p>
                          <p className="text-[9px] font-bold" style={{ color: "var(--text-faint)" }}>Best</p>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Practice Drills */}
                  <div>
                    <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>Practice Drills</p>
                    <div className="space-y-2">
                      {drill.drills.map((ex, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="shrink-0 mt-1.5 rounded-full"
                            style={{ width: 5, height: 5, background: "var(--accent-blue)" }} />
                          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{ex}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button type="button" onClick={async () => {
                      if (done) {
                        const entry = todayDone.get(drill.id);
                        if (!entry?._rowId) return;
                        setToast("saving");
                        try {
                          await deleteActivityLog(entry._rowId);
                          hapticLight(); setToast("saved"); reload();
                          setTimeout(() => setToast("idle"), 1500);
                        } catch { setToast("error"); setTimeout(() => setToast("idle"), 3000); }
                        return;
                      }
                      openLogSheet(drill, "drill");
                    }}
                    className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${done ? "btn-secondary" : "btn-primary"}`}>
                    {done
                      ? <><Check size={16} /> Drill Completed — tap to undo</>
                      : <><Zap size={16} /> Log Practice Drill</>}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── General / Combo Workouts ── */}
      <div>
        <p className="text-[10px] font-bold tracking-wider uppercase mb-2 px-1" style={{ color: "var(--text-faint)" }}>
          General Training
        </p>
        <div className="space-y-3">
          {GENERAL_WORKOUTS.map((w) => {
            const isOpen = expanded === w.id;
            const done = todayDone.has(w.id);

            return (
              <div key={w.id} className="rounded-2xl overflow-hidden transition-all"
                style={{
                  background: done ? "var(--accent-green-soft)" : "var(--bg-card)",
                  border: `1px solid ${done ? "var(--accent-green)" : "var(--border-primary)"}`,
                }}>
                <button type="button" onClick={() => toggle(w.id)}
                  className="w-full p-4 text-left flex items-center gap-3">
                  <span className="text-2xl shrink-0">{w.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{w.name}</p>
                      {done && <Check size={14} style={{ color: "var(--accent-green)" }} />}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{w.focus}</p>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "var(--bg-card-hover)", color: "var(--text-faint)" }}>
                        {w.duration}
                      </span>
                      {w.stations.map((s) => (
                        <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "var(--accent-blue-soft)", color: "var(--accent-blue)" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0" style={{ color: "var(--text-faint)" }}>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-0 space-y-3" style={{ borderTop: "1px solid var(--border-primary)" }}>
                    <div className="pt-3 space-y-2">
                      {w.exercises.map((ex, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="shrink-0 mt-1.5 rounded-full"
                            style={{ width: 5, height: 5, background: "var(--accent-blue)" }} />
                          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{ex}</p>
                        </div>
                      ))}
                    </div>

                    <button type="button" onClick={async () => {
                        if (done) {
                          const entry = todayDone.get(w.id);
                          if (!entry?._rowId) return;
                          setToast("saving");
                          try {
                            await deleteActivityLog(entry._rowId);
                            hapticLight(); setToast("saved"); reload();
                            setTimeout(() => setToast("idle"), 1500);
                          } catch { setToast("error"); setTimeout(() => setToast("idle"), 3000); }
                          return;
                        }
                        setToast("saving");
                        try {
                          await addActivityLog({
                            dateKey, activityKey: "race_train" as any, value: 1, unit: "count" as any,
                            notes: JSON.stringify({ workout: w.id, workoutName: w.name } as TrainLogData),
                          });
                          hapticSuccess(); setToast("saved"); reload();
                          setTimeout(() => setToast("idle"), 1500);
                        } catch { setToast("error"); setTimeout(() => setToast("idle"), 3000); }
                      }}
                      className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${done ? "btn-secondary" : "btn-primary"}`}>
                      {done
                        ? <><Check size={16} /> Completed Today — tap to undo</>
                        : <><Zap size={16} /> Log Workout</>}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Log station sheet — supports time trial + drill modes */}
      <BottomSheet open={!!logSheet} onClose={() => setLogSheet(null)} title={logSheet ? (logMode === "time_trial" ? `${logSheet.name} Rx Trial` : `Log ${logSheet.name}`) : "Log Workout"}>
        {logSheet && (
          <div className="space-y-4">
            {/* Rx standard reminder */}
            <div className="rounded-xl p-3" style={{ background: "var(--bg-card-hover)" }}>
              <p className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: "var(--text-faint)" }}>Rx Standard</p>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{logSheet.rxStandard}</p>
            </div>

            {/* Time input — only for time trials */}
            {logMode === "time_trial" && (
              <div>
                <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>Your Time (m:ss)</p>
                <input autoFocus className="w-full rounded-xl px-4 py-3.5 text-2xl font-black text-center tabular-nums"
                  style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1.5px solid var(--border-primary)" }}
                  placeholder="0:00"
                  inputMode="text"
                  value={timeInput} onChange={(e) => setTimeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLog()} />
                {bestTrials.get(logSheet.stationId) && (
                  <p className="text-xs text-center mt-2" style={{ color: "var(--text-faint)" }}>
                    Current best: <span className="font-bold tabular-nums" style={{ color: "var(--accent-blue)" }}>{fmtTime(bestTrials.get(logSheet.stationId)!)}</span>
                  </p>
                )}
              </div>
            )}

            {/* Rx / Scaled toggle */}
            <div>
              <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>
                {logMode === "time_trial" ? "At Rx standard?" : "Did you hit Rx standard?"}
              </p>
              <div className="flex gap-2">
                {[true, false].map((isRx) => (
                  <button key={String(isRx)} type="button"
                    onClick={() => { hapticLight(); setRxToggle(isRx); }}
                    className="flex-1 rounded-xl py-3 text-sm font-bold text-center transition-all active:scale-95"
                    style={{
                      background: rxToggle === isRx ? (isRx ? "var(--accent-green-soft)" : "var(--accent-yellow-soft)") : "var(--bg-card)",
                      color: rxToggle === isRx ? (isRx ? "var(--accent-green)" : "var(--accent-yellow)") : "var(--text-muted)",
                      border: `1.5px solid ${rxToggle === isRx ? (isRx ? "var(--accent-green)" : "var(--accent-yellow)") : "var(--border-primary)"}`,
                    }}>
                    {isRx ? "Rx\u2019d" : "Scaled"}
                  </button>
                ))}
              </div>
            </div>

            {/* Save */}
            <button type="button" onClick={handleLog}
              disabled={logMode === "time_trial" && !parseTimeStr(timeInput)}
              className="btn-primary w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2"
              style={logMode === "time_trial" && !parseTimeStr(timeInput) ? { opacity: 0.5 } : {}}>
              {logMode === "time_trial"
                ? <><Timer size={18} /> Save Time Trial {rxToggle ? "Rx" : "Scaled"}</>
                : <><Zap size={18} /> Log {logSheet.name} {rxToggle ? "Rx" : "Scaled"}</>}
            </button>

            {/* Time trial progression history */}
            {logMode === "time_trial" && (() => {
              const history = allTraining
                .map((row) => ({ row, data: parseJSON<TrainLogData>(row.notes) }))
                .filter(({ data }) => data.stationId === logSheet.stationId && data.mode === "time_trial" && data.timeSeconds)
                .sort((a, b) => b.row.date.localeCompare(a.row.date));
              if (history.length === 0) return null;
              return (
                <div>
                  <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>
                    Time Trial History ({history.length})
                  </p>
                  <div className="space-y-1.5" style={{ maxHeight: 180, overflowY: "auto" }}>
                    {history.map(({ row, data }, i) => {
                      const prev = i < history.length - 1 ? history[i + 1].data : null;
                      const curTime = data.timeSeconds ?? 0;
                      const prevTime = prev?.timeSeconds ?? 0;
                      const improved = prev && curTime < prevTime;
                      const declined = prev && curTime > prevTime;
                      return (
                        <div key={row.id} className="flex items-center gap-2.5 rounded-lg px-3 py-2"
                          style={{ background: "var(--bg-card)" }}>
                          <p className="text-xs tabular-nums shrink-0" style={{ color: "var(--text-faint)", width: 72 }}>
                            {format(new Date(row.date), "MMM d")}
                          </p>
                          <div className="flex-1 flex items-center gap-1.5">
                            <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                              {fmtTime(curTime)}
                            </p>
                            {data.rx && (
                              <span className="text-[9px] font-bold px-1 py-0.5 rounded"
                                style={{ background: "var(--accent-green-soft)", color: "var(--accent-green)" }}>Rx</span>
                            )}
                            {improved && <TrendingUp size={12} style={{ color: "var(--accent-green)" }} />}
                            {declined && <TrendingDown size={12} style={{ color: "var(--accent-red)" }} />}
                          </div>
                          {i === 0 && curTime === bestTrials.get(logSheet.stationId) && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded"
                              style={{ background: "var(--accent-blue)", color: "white" }}>Best</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </BottomSheet>
    </>
  );
}

// ═══════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════

export default function RacePage() {
  const [tab, setTab] = useState("race");
  const [allRaces, setAllRaces] = useState<ActivityLogRow[]>([]);
  const [allTraining, setAllTraining] = useState<ActivityLogRow[]>([]);

  const loadAll = useCallback(async () => {
    try {
      const to = format(new Date(), "yyyy-MM-dd");
      const from = format(subDays(new Date(), 730), "yyyy-MM-dd");
      const [races, training] = await Promise.all([
        listActivityLogs({ from, to, activityKey: "race_log" as any }),
        listActivityLogs({ from, to, activityKey: "race_train" as any }),
      ]);
      setAllRaces(races); setAllTraining(training);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  return (
    <div className="space-y-5">
      {/* Header — pr-12 avoids SettingsGear overlap */}
      <header>
        <div className="flex items-center justify-between pr-12">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            🏁 Hybrid Race
          </h1>
          <Link href="/app/race/history"
            className="tap-btn shrink-0 flex items-center justify-center rounded-full"
            style={{ width: 36, height: 36, background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
            <History size={16} style={{ color: "var(--text-muted)" }} />
          </Link>
        </div>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>Train for 8-station fitness races</p>
      </header>

      <TabBar active={tab} tabs={[{ key: "race", label: "Race Log" }, { key: "train", label: "Training" }]} onChange={setTab} />

      {tab === "race"
        ? <RaceLogTab allRaces={allRaces} reload={loadAll} />
        : <TrainingTab allTraining={allTraining} reload={loadAll} />}
    </div>
  );
}
