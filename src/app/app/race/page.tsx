"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { History, Check, ChevronDown, Timer, Dumbbell, Flag, Play } from "lucide-react";
import Link from "next/link";
import { useToday } from "@/lib/hooks";
import { addActivityLog, listActivityLogs, type ActivityLogRow } from "@/lib/activity";
import { Toast, type ToastState } from "@/app/app/_components/ui";
import { hapticSuccess, hapticLight, hapticSelection, hapticMedium } from "@/lib/haptics";
import { format, subDays } from "date-fns";

// ═══════════════════════════════════════════════
// Race Format — 8 stations with 8x 1km runs
// ═══════════════════════════════════════════════

interface Station {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

const STATIONS: Station[] = [
  { id: "skierg", name: "SkiErg", description: "1000m", emoji: "⛷️" },
  { id: "sled_push", name: "Sled Push", description: "50m", emoji: "🛷" },
  { id: "sled_pull", name: "Sled Pull", description: "50m", emoji: "🪢" },
  { id: "burpee_broad_jump", name: "Burpee Broad Jump", description: "80m", emoji: "🐸" },
  { id: "row", name: "Row", description: "1000m", emoji: "🚣" },
  { id: "farmers_carry", name: "Farmers Carry", description: "200m", emoji: "🏋️" },
  { id: "sandbag_lunges", name: "Sandbag Lunges", description: "100m", emoji: "🏃" },
  { id: "wall_balls", name: "Wall Balls", description: "75–100 reps", emoji: "🎯" },
];

type Division = "open_m" | "open_f" | "pro_m" | "pro_f";

const DIVISIONS: { key: Division; label: string }[] = [
  { key: "open_m", label: "Open (M)" },
  { key: "open_f", label: "Open (F)" },
  { key: "pro_m", label: "Pro (M)" },
  { key: "pro_f", label: "Pro (F)" },
];

// ═══════════════════════════════════════════════
// Training Workouts
// ═══════════════════════════════════════════════

interface TrainingWorkout {
  id: string;
  name: string;
  focus: string;
  targetStations: string[];
  description: string;
  exercises: string[];
  estimatedMinutes: number;
}

const TRAINING_WORKOUTS: TrainingWorkout[] = [
  {
    id: "ergo_endurance",
    name: "Erg Endurance",
    focus: "SkiErg & Row",
    targetStations: ["skierg", "row"],
    description: "Build erg pacing and cardio base",
    exercises: [
      "Buy-in: 1000m SkiErg",
      "3 rounds: 500m Row + 500m SkiErg",
      "Cash-out: 1000m Row",
      "Target: Maintain consistent pace across all sets",
    ],
    estimatedMinutes: 30,
  },
  {
    id: "sled_power",
    name: "Sled Power",
    focus: "Sled Push & Pull",
    targetStations: ["sled_push", "sled_pull"],
    description: "Build pushing and pulling strength under fatigue",
    exercises: [
      "5 rounds:",
      "  50m Sled Push (race weight)",
      "  50m Sled Pull (race weight)",
      "  200m Run",
      "  Rest 90 seconds",
      "Focus on leg drive and steady breathing",
    ],
    estimatedMinutes: 35,
  },
  {
    id: "carry_lunge",
    name: "Carry & Lunge Grind",
    focus: "Farmers Carry & Lunges",
    targetStations: ["farmers_carry", "sandbag_lunges"],
    description: "Grip endurance and leg stamina",
    exercises: [
      "4 rounds:",
      "  200m Farmers Carry (race weight)",
      "  50m Sandbag Lunges",
      "  400m Run",
      "  Rest 2 minutes",
    ],
    estimatedMinutes: 40,
  },
  {
    id: "wall_ball_blast",
    name: "Wall Ball Blast",
    focus: "Wall Balls & Conditioning",
    targetStations: ["wall_balls"],
    description: "Build wall ball endurance for the final station",
    exercises: [
      "5 rounds:",
      "  25 Wall Balls (race weight)",
      "  200m Run",
      "  Rest 60 seconds",
      "Then: 50 unbroken Wall Balls for time",
    ],
    estimatedMinutes: 25,
  },
  {
    id: "bbj_conditioning",
    name: "BBJ Conditioning",
    focus: "Burpee Broad Jumps",
    targetStations: ["burpee_broad_jump"],
    description: "Pacing and efficiency for the hardest station",
    exercises: [
      "6 rounds:",
      "  20m Burpee Broad Jumps",
      "  200m Run",
      "  Rest 90 seconds",
      "Focus on consistent jump distance and breathing rhythm",
    ],
    estimatedMinutes: 30,
  },
  {
    id: "race_simulation",
    name: "Full Race Simulation",
    focus: "All Stations",
    targetStations: STATIONS.map((s) => s.id),
    description: "Complete race rehearsal at 80% effort",
    exercises: [
      "Run 1km → 1000m SkiErg",
      "Run 1km → 50m Sled Push",
      "Run 1km → 50m Sled Pull",
      "Run 1km → 80m Burpee Broad Jumps",
      "Run 1km → 1000m Row",
      "Run 1km → 200m Farmers Carry",
      "Run 1km → 100m Sandbag Lunges",
      "Run 1km → 75–100 Wall Balls",
      "Record all split times!",
    ],
    estimatedMinutes: 75,
  },
  {
    id: "running_base",
    name: "Running Base Builder",
    focus: "Running Endurance",
    targetStations: [],
    description: "Build the aerobic base — running is 50%+ of race time",
    exercises: [
      "8 x 1km repeats",
      "Run each at your target race pace",
      "Rest 60–90 seconds between each",
      "Goal: Even splits across all 8 intervals",
    ],
    estimatedMinutes: 45,
  },
  {
    id: "station_sandwich",
    name: "Station Sandwich",
    focus: "Mixed Stations",
    targetStations: ["skierg", "sled_push", "row", "wall_balls"],
    description: "Run-station-run transitions under fatigue",
    exercises: [
      "3 rounds of:",
      "  800m Run → 500m SkiErg",
      "  800m Run → 25m Sled Push",
      "  800m Run → 500m Row",
      "  800m Run → 30 Wall Balls",
      "Minimal rest between transitions",
    ],
    estimatedMinutes: 50,
  },
];

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

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

function parseTimeInput(str: string): number | null {
  if (!str.trim()) return null;
  // h:mm:ss
  const hMatch = str.match(/^(\d+):(\d{1,2}):(\d{1,2})$/);
  if (hMatch) return parseInt(hMatch[1]) * 3600 + parseInt(hMatch[2]) * 60 + parseInt(hMatch[3]);
  // m:ss
  const mMatch = str.match(/^(\d+):(\d{1,2})$/);
  if (mMatch) return parseInt(mMatch[1]) * 60 + parseInt(mMatch[2]);
  // seconds
  const num = parseInt(str);
  if (!isNaN(num) && num > 0) return num;
  return null;
}

interface RaceLog {
  division: Division;
  runs: (number | null)[]; // 8 run times in seconds
  stations: (number | null)[]; // 8 station times in seconds
  totalSeconds: number;
  date: string;
}

function parseRaceNotes(notes: string | null): Partial<RaceLog> {
  if (!notes) return {};
  try { return JSON.parse(notes); } catch { return {}; }
}

// ═══════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════

function TabBar({ active, onChange }: { active: "race" | "training"; onChange: (t: "race" | "training") => void }) {
  return (
    <div className="flex rounded-xl p-1" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
      {(["race", "training"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => { hapticSelection(); onChange(t); }}
          className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-center transition-all"
          style={{
            background: active === t ? "var(--accent-primary)" : "transparent",
            color: active === t ? "#fff" : "var(--text-muted)",
          }}
        >
          {t === "race" ? "Race Log" : "Training"}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Race Log Tab
// ═══════════════════════════════════════════════

function RaceLogTab() {
  const { dateKey } = useToday();
  const [division, setDivision] = useState<Division>("open_m");
  const [runInputs, setRunInputs] = useState<string[]>(Array(8).fill(""));
  const [stationInputs, setStationInputs] = useState<string[]>(Array(8).fill(""));
  const [toast, setToast] = useState<ToastState>("idle");
  const [justSaved, setJustSaved] = useState(false);
  const [recentRaces, setRecentRaces] = useState<ActivityLogRow[]>([]);
  const [raceLoading, setRaceLoading] = useState(true);

  const loadRaces = useCallback(async () => {
    setRaceLoading(true);
    try {
      const to = format(new Date(), "yyyy-MM-dd");
      const from = format(subDays(new Date(), 365), "yyyy-MM-dd");
      const rows = await listActivityLogs({ from, to, activityKey: "race_log" as any });
      setRecentRaces(rows);
    } catch { /* empty */ }
    finally { setRaceLoading(false); }
  }, []);

  useEffect(() => { void loadRaces(); }, [loadRaces]);

  // Calculate total
  const runTimes = runInputs.map(parseTimeInput);
  const stationTimes = stationInputs.map(parseTimeInput);
  const totalSeconds = [...runTimes, ...stationTimes].reduce((sum: number, t) => sum + (t ?? 0), 0);
  const filledCount = [...runTimes, ...stationTimes].filter((t) => t !== null).length;

  const handleSave = async () => {
    if (filledCount === 0) return;

    setToast("saving");
    try {
      const notes: RaceLog = {
        division,
        runs: runTimes,
        stations: stationTimes,
        totalSeconds,
        date: dateKey,
      };
      await addActivityLog({
        dateKey,
        activityKey: "race_log" as any,
        value: totalSeconds,
        unit: "seconds" as any,
        notes: JSON.stringify(notes),
      });
      hapticSuccess();
      setRunInputs(Array(8).fill(""));
      setStationInputs(Array(8).fill(""));
      setJustSaved(true);
      setToast("saved");
      setTimeout(() => { setToast("idle"); setJustSaved(false); }, 2000);
      void loadRaces();
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  const updateRun = (i: number, val: string) => {
    setRunInputs((prev) => { const next = [...prev]; next[i] = val; return next; });
  };
  const updateStation = (i: number, val: string) => {
    setStationInputs((prev) => { const next = [...prev]; next[i] = val; return next; });
  };

  return (
    <>
      <Toast state={toast} />

      {/* Division selector */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {DIVISIONS.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => { hapticLight(); setDivision(d.key); }}
            className="shrink-0 rounded-lg px-3.5 py-2 text-xs font-bold tracking-wider uppercase transition-all"
            style={{
              background: division === d.key ? "var(--accent-primary)" : "var(--bg-card)",
              color: division === d.key ? "#fff" : "var(--text-muted)",
              border: `1px solid ${division === d.key ? "var(--accent-primary)" : "var(--border-primary)"}`,
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Station entries */}
      <section className="card p-4 space-y-1">
        <p className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: "var(--text-faint)" }}>
          Split Times (m:ss)
        </p>

        {STATIONS.map((station, i) => (
          <div key={station.id}>
            {/* Run */}
            <div className="flex items-center gap-3 py-2">
              <span className="text-sm shrink-0 w-8 text-center" style={{ color: "var(--text-faint)" }}>🏃</span>
              <p className="text-sm flex-1" style={{ color: "var(--text-muted)" }}>Run {i + 1} (1km)</p>
              <input
                className="w-20 rounded-lg px-3 py-2 text-sm font-semibold tabular-nums text-right"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-primary)",
                  color: "var(--text-primary)",
                }}
                placeholder="5:00"
                value={runInputs[i]}
                onChange={(e) => updateRun(i, e.target.value)}
              />
            </div>
            {/* Station */}
            <div className="flex items-center gap-3 py-2" style={{ borderBottom: i < 7 ? "1px solid var(--border-primary)" : "none" }}>
              <span className="text-sm shrink-0 w-8 text-center">{station.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{station.name}</p>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>{station.description}</p>
              </div>
              <input
                className="w-20 rounded-lg px-3 py-2 text-sm font-semibold tabular-nums text-right"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-primary)",
                  color: "var(--text-primary)",
                }}
                placeholder="4:30"
                value={stationInputs[i]}
                onChange={(e) => updateStation(i, e.target.value)}
              />
            </div>
          </div>
        ))}

        {/* Total */}
        {filledCount > 0 && (
          <div className="flex items-center justify-between pt-4 mt-2" style={{ borderTop: "2px solid var(--border-primary)" }}>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Total Time</p>
            <p className="text-xl font-bold tabular-nums" style={{ color: "var(--accent-primary)" }}>
              {fmtTime(totalSeconds)}
            </p>
          </div>
        )}

        {/* Save */}
        <button type="button" className="btn-primary text-sm w-full flex items-center justify-center gap-2 mt-3" onClick={handleSave}>
          {justSaved ? <><Check size={16} /> Saved!</> : <><Flag size={16} /> Log Race</>}
        </button>
      </section>

      {/* Recent races */}
      <section className="card p-4">
        <p className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: "var(--text-faint)" }}>
          Recent Races
        </p>
        {raceLoading ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>
        ) : recentRaces.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No races logged yet.</p>
        ) : (
          <div className="space-y-2">
            {recentRaces.slice(0, 5).map((row) => {
              const data = parseRaceNotes(row.notes);
              const divLabel = DIVISIONS.find((d) => d.key === data.division)?.label ?? "Open";
              return (
                <div key={row.id} className="flex items-center justify-between py-2 px-1" style={{ borderBottom: "1px solid var(--border-primary)" }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{divLabel}</p>
                    <p className="text-xs" style={{ color: "var(--text-faint)" }}>{row.date}</p>
                  </div>
                  <p className="text-lg font-bold tabular-nums" style={{ color: "var(--accent-primary)" }}>
                    {data.totalSeconds ? fmtTime(data.totalSeconds) : row.value}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

// ═══════════════════════════════════════════════
// Training Tab
// ═══════════════════════════════════════════════

function TrainingTab() {
  const { dateKey } = useToday();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>("idle");
  const [loggedToday, setLoggedToday] = useState<Set<string>>(new Set());

  const handleLog = async (workout: TrainingWorkout) => {
    setToast("saving");
    try {
      await addActivityLog({
        dateKey,
        activityKey: "race_train" as any,
        value: workout.estimatedMinutes,
        unit: "minutes" as any,
        notes: JSON.stringify({ workoutId: workout.id, workoutName: workout.name, focus: workout.focus }),
      });
      hapticSuccess();
      setLoggedToday((prev) => new Set(prev).add(workout.id));
      setToast("saved");
      setTimeout(() => setToast("idle"), 2000);
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  return (
    <>
      <Toast state={toast} />

      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Training workouts targeting each race station. Tap to expand, then log when complete.
      </p>

      <div className="space-y-3">
        {TRAINING_WORKOUTS.map((w) => {
          const isExpanded = expanded === w.id;
          const isLogged = loggedToday.has(w.id);
          return (
            <section key={w.id} className="card overflow-hidden">
              <button
                type="button"
                onClick={() => { hapticLight(); setExpanded(isExpanded ? null : w.id); }}
                className="w-full p-4 flex items-center gap-3 text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {w.name}
                    {isLogged && <span className="ml-2 text-xs" style={{ color: "var(--accent-green)" }}>✓ Logged</span>}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {w.focus} — ~{w.estimatedMinutes} min
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  style={{
                    color: "var(--text-faint)",
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid var(--border-primary)" }}>
                  <p className="text-xs pt-3" style={{ color: "var(--text-muted)" }}>{w.description}</p>
                  <div className="rounded-xl p-3 space-y-1" style={{ background: "var(--bg-input)" }}>
                    {w.exercises.map((ex, i) => (
                      <p key={i} className="text-sm" style={{ color: "var(--text-primary)", paddingLeft: ex.startsWith("  ") ? "1rem" : 0 }}>
                        {ex.trim()}
                      </p>
                    ))}
                  </div>
                  {/* Station tags */}
                  {w.targetStations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {w.targetStations.map((sid) => {
                        const station = STATIONS.find((s) => s.id === sid);
                        if (!station) return null;
                        return (
                          <span key={sid} className="rounded-md px-2 py-1 text-xs font-medium" style={{ background: "var(--bg-card-hover)", color: "var(--text-muted)" }}>
                            {station.emoji} {station.name}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleLog(w)}
                    disabled={isLogged}
                    className="btn-primary text-sm w-full flex items-center justify-center gap-2"
                    style={isLogged ? { opacity: 0.5, cursor: "default" } : {}}
                  >
                    {isLogged ? <><Check size={16} /> Done!</> : <><Dumbbell size={16} /> Log Workout</>}
                  </button>
                </div>
              )}
            </section>
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
  const [tab, setTab] = useState<"race" | "training">("race");

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            🏁 Hybrid Race
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Run + 8 functional stations</p>
        </div>
        <Link href="/app/race/history" className="p-2.5 rounded-xl transition-colors" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <History size={18} style={{ color: "var(--text-muted)" }} />
        </Link>
      </header>

      <TabBar active={tab} onChange={setTab} />

      {tab === "race" ? <RaceLogTab /> : <TrainingTab />}
    </div>
  );
}
