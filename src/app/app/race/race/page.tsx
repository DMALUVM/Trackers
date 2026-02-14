"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { History, Check, ChevronDown, ChevronUp, Play, Flag, Zap } from "lucide-react";
import Link from "next/link";
import { useToday } from "@/lib/hooks";
import { addActivityLog, listActivityLogs, type ActivityLogRow } from "@/lib/activity";
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
  { id: "run1",  label: "Run 1",     detail: "1 km",     type: "run",     icon: "🏃", color: "var(--accent-green)" },
  { id: "ski",   label: "SkiErg",    detail: "1,000 m",  type: "station", icon: "⛷️", color: "var(--accent-blue)" },
  { id: "run2",  label: "Run 2",     detail: "1 km",     type: "run",     icon: "🏃", color: "var(--accent-green)" },
  { id: "push",  label: "Sled Push", detail: "50 m",     type: "station", icon: "🛷", color: "var(--accent-blue)" },
  { id: "run3",  label: "Run 3",     detail: "1 km",     type: "run",     icon: "🏃", color: "var(--accent-green)" },
  { id: "pull",  label: "Sled Pull", detail: "50 m",     type: "station", icon: "🪢", color: "var(--accent-blue)" },
  { id: "run4",  label: "Run 4",     detail: "1 km",     type: "run",     icon: "🏃", color: "var(--accent-green)" },
  { id: "bbj",   label: "Burpee BJ", detail: "80 m",     type: "station", icon: "💥", color: "var(--accent-blue)" },
  { id: "run5",  label: "Run 5",     detail: "1 km",     type: "run",     icon: "🏃", color: "var(--accent-green)" },
  { id: "row",   label: "Row",       detail: "1,000 m",  type: "station", icon: "🚣", color: "var(--accent-blue)" },
  { id: "run6",  label: "Run 6",     detail: "1 km",     type: "run",     icon: "🏃", color: "var(--accent-green)" },
  { id: "carry", label: "Farmers Carry", detail: "200 m", type: "station", icon: "🧑‍🌾", color: "var(--accent-blue)" },
  { id: "run7",  label: "Run 7",     detail: "1 km",     type: "run",     icon: "🏃", color: "var(--accent-green)" },
  { id: "lunge", label: "Lunges",    detail: "100 m",    type: "station", icon: "🏋️", color: "var(--accent-blue)" },
  { id: "run8",  label: "Run 8",     detail: "1 km",     type: "run",     icon: "🏃", color: "var(--accent-green)" },
  { id: "wall",  label: "Wall Balls", detail: "75–100 reps", type: "station", icon: "🎯", color: "var(--accent-blue)" },
];

type Division = "open_m" | "open_f" | "pro_m" | "pro_f";

const DIVISIONS: { key: Division; label: string; short: string }[] = [
  { key: "open_m", label: "Open Men",  short: "Open M" },
  { key: "open_f", label: "Open Women", short: "Open W" },
  { key: "pro_m",  label: "Pro Men",   short: "Pro M" },
  { key: "pro_f",  label: "Pro Women",  short: "Pro W" },
];

// ═══════════════════════════════════════════════
// Training Workouts
// ═══════════════════════════════════════════════

interface TrainingWorkout {
  id: string;
  name: string;
  focus: string;
  emoji: string;
  stations: string[];
  exercises: string[];
  duration: string;
}

const TRAINING_WORKOUTS: TrainingWorkout[] = [
  {
    id: "erg_endurance", name: "Erg Endurance", focus: "Aerobic Base",
    emoji: "⛷️", stations: ["SkiErg", "Row"],
    exercises: ["4 x 500m SkiErg (90s rest)", "4 x 500m Row (90s rest)", "2 x 1000m alternating (2min rest)"],
    duration: "35 min",
  },
  {
    id: "sled_power", name: "Sled Power", focus: "Strength Endurance",
    emoji: "🛷", stations: ["Sled Push", "Sled Pull"],
    exercises: ["6 x 25m Sled Push (heavy)", "6 x 25m Sled Pull (heavy)", "3 x 50m Push-Pull combo (race weight)"],
    duration: "25 min",
  },
  {
    id: "carry_lunge", name: "Carry & Lunge Grind", focus: "Lower Body",
    emoji: "🏋️", stations: ["Farmers Carry", "Lunges"],
    exercises: ["4 x 100m Farmers Carry (race weight)", "4 x 50m Sandbag Lunges", "2 x 200m Carry + 100m Lunge combo"],
    duration: "30 min",
  },
  {
    id: "wall_ball", name: "Wall Ball Blast", focus: "Stamina",
    emoji: "🎯", stations: ["Wall Balls"],
    exercises: ["5 x 20 Wall Balls (30s rest)", "3 x 30 Wall Balls (60s rest)", "1 x 75 Wall Balls (time trial)"],
    duration: "20 min",
  },
  {
    id: "bbj_condition", name: "BBJ Conditioning", focus: "Full Body",
    emoji: "💥", stations: ["Burpee BJ"],
    exercises: ["5 x 20m Burpee Broad Jumps", "10 Burpees + 20m BBJ x 4 rounds", "80m BBJ time trial"],
    duration: "20 min",
  },
  {
    id: "full_sim", name: "Full Race Simulation", focus: "Race Prep",
    emoji: "🏁", stations: ["All Stations"],
    exercises: ["Complete all 8 runs (1km each)", "All 8 stations at race standards", "Record total time and splits"],
    duration: "60–90 min",
  },
  {
    id: "running_base", name: "Running Base Builder", focus: "Cardio",
    emoji: "🏃", stations: ["Running"],
    exercises: ["8 x 1km intervals (target: race pace)", "Rest 60s between intervals", "Final km: all-out effort"],
    duration: "45 min",
  },
  {
    id: "station_sandwich", name: "Station Sandwich", focus: "Transitions",
    emoji: "🥪", stations: ["Mixed"],
    exercises: ["1km Run → 500m SkiErg → 1km Run", "1km Run → 25m Sled Push → 25m Sled Pull → 1km Run", "1km Run → 50 Wall Balls → 1km Run"],
    duration: "40 min",
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
  // h:mm:ss
  const hms = str.match(/^(\d+):(\d{1,2}):(\d{1,2})$/);
  if (hms) return parseInt(hms[1]) * 3600 + parseInt(hms[2]) * 60 + parseInt(hms[3]);
  // m:ss
  const ms = str.match(/^(\d+):(\d{1,2})$/);
  if (ms) return parseInt(ms[1]) * 60 + parseInt(ms[2]);
  // plain seconds
  const n = parseInt(str);
  return !isNaN(n) && n > 0 ? n : null;
}

interface RaceLogData {
  division: Division;
  splits: Record<string, number>; // segment id → seconds
  totalSeconds: number;
}

interface TrainLogData {
  workout: string;
  workoutName: string;
}

function parseJSON<T>(notes: string | null): Partial<T> {
  if (!notes) return {};
  try { return JSON.parse(notes); } catch { return {}; }
}

// ═══════════════════════════════════════════════
// Shared: Tab Bar
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
// Race Log Tab — Stepped Split Entry
// ═══════════════════════════════════════════════

function RaceLogTab({ allRaces, reload }: { allRaces: ActivityLogRow[]; reload: () => void }) {
  const { dateKey } = useToday();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [division, setDivision] = useState<Division>("open_m");
  const [splits, setSplits] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<ToastState>("idle");
  const [justSaved, setJustSaved] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Best race lookup
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
  };

  const updateSplit = (segId: string, val: string) => {
    setSplits((prev) => ({ ...prev, [segId]: val }));
    setJustSaved(false);
  };

  // Auto-advance to next input on valid entry
  const handleKeyDown = (segId: string, e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const idx = SEGMENTS.findIndex((s) => s.id === segId);
      if (idx < SEGMENTS.length - 1) {
        const nextId = SEGMENTS[idx + 1].id;
        inputRefs.current[nextId]?.focus();
      } else {
        // Last segment — blur to dismiss keyboard
        (e.target as HTMLInputElement).blur();
      }
    }
  };

  // Calculate total
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
        dateKey, activityKey: "race_log" as any,
        value: totalSeconds, unit: "count" as any,
        notes: JSON.stringify(notes),
      });
      hapticHeavy();
      setJustSaved(true);
      setToast("saved");
      reload();
      setTimeout(() => setToast("idle"), 2000);
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  return (
    <>
      <Toast state={toast} />

      {/* Best Race Summary Card */}
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

      {/* Log New Race CTA */}
      <button type="button" onClick={openSheet}
        className="w-full rounded-2xl p-5 text-center transition-all active:scale-[0.98]"
        style={{
          background: "var(--accent-green)",
          boxShadow: "0 4px 24px rgba(16,185,129,0.3)",
        }}>
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
          <p className="text-[10px] font-bold tracking-wider uppercase mb-2 px-1"
            style={{ color: "var(--text-faint)" }}>Recent Races</p>
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

      {/* ── Race Entry Bottom Sheet ── */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Log Race">
        <div className="space-y-5">
          {/* Division selector */}
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>Division</p>
            <div className="grid grid-cols-4 gap-1.5">
              {DIVISIONS.map((d) => (
                <button key={d.key} type="button"
                  onClick={() => { hapticLight(); setDivision(d.key); }}
                  className="rounded-xl py-2.5 text-xs font-bold text-center transition-all active:scale-95"
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

          {/* Split times — visual timeline */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>
                Split Times (m:ss)
              </p>
              <p className="text-[10px] font-bold tabular-nums" style={{ color: "var(--text-faint)" }}>
                {filledCount}/16
              </p>
            </div>

            <div className="space-y-1.5">
              {SEGMENTS.map((seg, idx) => (
                <div key={seg.id} className="flex items-center gap-2.5">
                  {/* Timeline dot + line */}
                  <div className="flex flex-col items-center" style={{ width: 20 }}>
                    <div className="rounded-full shrink-0" style={{
                      width: 10, height: 10,
                      background: parsedSplits[seg.id] ? seg.color : "var(--bg-card-hover)",
                      border: `2px solid ${parsedSplits[seg.id] ? seg.color : "var(--border-primary)"}`,
                    }} />
                    {idx < SEGMENTS.length - 1 && (
                      <div style={{
                        width: 2, height: 16,
                        background: parsedSplits[seg.id] ? seg.color : "var(--border-primary)",
                        opacity: 0.4,
                      }} />
                    )}
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{seg.icon}</span>
                      <span className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>{seg.label}</span>
                      <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>{seg.detail}</span>
                    </div>
                  </div>

                  {/* Time input */}
                  <input
                    ref={(el) => { inputRefs.current[seg.id] = el; }}
                    className="shrink-0 rounded-lg px-3 py-2 text-right text-sm font-bold tabular-nums"
                    style={{
                      width: 80,
                      background: "var(--bg-input)",
                      border: `1.5px solid ${parsedSplits[seg.id] ? seg.color : "var(--border-primary)"}`,
                      color: "var(--text-primary)",
                    }}
                    placeholder="0:00"
                    value={splits[seg.id] ?? ""}
                    onChange={(e) => updateSplit(seg.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(seg.id, e)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Total time */}
          {filledCount > 0 && (
            <div className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ background: "var(--accent-green-soft)", border: "1px solid var(--accent-green)" }}>
              <p className="text-xs font-bold" style={{ color: "var(--accent-green)" }}>Total Time</p>
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
              : <><Flag size={18} /> Save Race</>}
          </button>
        </div>
      </BottomSheet>
    </>
  );
}

// ═══════════════════════════════════════════════
// Training Tab
// ═══════════════════════════════════════════════

function TrainingTab({ allTraining, reload }: { allTraining: ActivityLogRow[]; reload: () => void }) {
  const { dateKey } = useToday();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>("idle");

  // Today's completed workouts
  const todayDone = useMemo(() => {
    const set = new Set<string>();
    for (const row of allTraining) {
      if (row.date !== dateKey) continue;
      const d = parseJSON<TrainLogData>(row.notes);
      if (d.workout) set.add(d.workout);
    }
    return set;
  }, [allTraining, dateKey]);

  const handleLog = async (workout: TrainingWorkout) => {
    if (todayDone.has(workout.id)) return;
    setToast("saving");
    try {
      const notes: TrainLogData = { workout: workout.id, workoutName: workout.name };
      await addActivityLog({
        dateKey, activityKey: "race_train" as any,
        value: 1, unit: "count" as any,
        notes: JSON.stringify(notes),
      });
      hapticSuccess();
      setToast("saved");
      reload();
      setTimeout(() => setToast("idle"), 1500);
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  const toggle = (id: string) => {
    hapticLight();
    setExpanded((prev) => prev === id ? null : id);
  };

  return (
    <>
      <Toast state={toast} />

      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Curated workouts targeting each race station. Tap to expand, then log when complete.
      </p>

      <div className="space-y-3">
        {TRAINING_WORKOUTS.map((w) => {
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
                  <div className="flex gap-1.5 mt-2 flex-wrap">
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

                  <button type="button" onClick={() => handleLog(w)}
                    disabled={done}
                    className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                    style={done ? { opacity: 0.5 } : {}}>
                    {done
                      ? <><Check size={16} /> Completed Today</>
                      : <><Zap size={16} /> Log Workout</>}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
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
      setAllRaces(races);
      setAllTraining(training);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            🏁 Hybrid Race
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>Train for 8-station fitness races</p>
        </div>
        <Link href="/app/race/history"
          className="tap-btn shrink-0 flex items-center justify-center rounded-full"
          style={{ width: 40, height: 40, background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <History size={18} style={{ color: "var(--text-muted)" }} />
        </Link>
      </header>

      <TabBar active={tab} tabs={[{ key: "race", label: "Race Log" }, { key: "train", label: "Training" }]} onChange={setTab} />

      {tab === "race"
        ? <RaceLogTab allRaces={allRaces} reload={loadAll} />
        : <TrainingTab allTraining={allTraining} reload={loadAll} />}
    </div>
  );
}
