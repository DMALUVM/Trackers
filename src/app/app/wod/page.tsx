"use client";

import { useState, useEffect, useCallback } from "react";
import { History, Check, ChevronDown, Trophy, Timer, Repeat, Crown } from "lucide-react";
import Link from "next/link";
import { useToday } from "@/lib/hooks";
import { addActivityLog, listActivityLogs, type ActivityLogRow } from "@/lib/activity";
import { Toast, type ToastState } from "@/app/app/_components/ui";
import { hapticSuccess, hapticLight, hapticSelection } from "@/lib/haptics";
import { format, subDays } from "date-fns";

// ═══════════════════════════════════════════════
// Lift definitions
// ═══════════════════════════════════════════════

type LiftCategory = "olympic" | "squat" | "press" | "pull" | "gymnastics";

interface Lift {
  id: string;
  name: string;
  category: LiftCategory;
  repSchemes: string[]; // e.g. ["1RM","3RM","5RM"]
}

const LIFTS: Lift[] = [
  // Olympic
  { id: "clean", name: "Clean", category: "olympic", repSchemes: ["1RM", "3RM"] },
  { id: "power_clean", name: "Power Clean", category: "olympic", repSchemes: ["1RM", "3RM"] },
  { id: "clean_jerk", name: "Clean & Jerk", category: "olympic", repSchemes: ["1RM"] },
  { id: "snatch", name: "Snatch", category: "olympic", repSchemes: ["1RM", "3RM"] },
  { id: "power_snatch", name: "Power Snatch", category: "olympic", repSchemes: ["1RM", "3RM"] },
  { id: "thruster", name: "Thruster", category: "olympic", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "hang_clean", name: "Hang Clean", category: "olympic", repSchemes: ["1RM", "3RM"] },
  { id: "hang_snatch", name: "Hang Snatch", category: "olympic", repSchemes: ["1RM", "3RM"] },
  // Squats
  { id: "back_squat", name: "Back Squat", category: "squat", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "front_squat", name: "Front Squat", category: "squat", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "overhead_squat", name: "Overhead Squat", category: "squat", repSchemes: ["1RM", "3RM"] },
  { id: "pistol_squat", name: "Pistol Squat", category: "squat", repSchemes: ["Max Reps"] },
  // Press
  { id: "strict_press", name: "Strict Press", category: "press", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "push_press", name: "Push Press", category: "press", repSchemes: ["1RM", "3RM"] },
  { id: "push_jerk", name: "Push Jerk", category: "press", repSchemes: ["1RM", "3RM"] },
  { id: "split_jerk", name: "Split Jerk", category: "press", repSchemes: ["1RM"] },
  { id: "bench_press", name: "Bench Press", category: "press", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "hspu", name: "Handstand Push-up", category: "press", repSchemes: ["Max Reps"] },
  // Pull
  { id: "deadlift", name: "Deadlift", category: "pull", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "sumo_deadlift", name: "Sumo Deadlift", category: "pull", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "pull_up", name: "Pull-up", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "strict_pull_up", name: "Strict Pull-up", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "muscle_up_ring", name: "Ring Muscle-up", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "muscle_up_bar", name: "Bar Muscle-up", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "toes_to_bar", name: "Toes-to-Bar", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "rope_climb", name: "Rope Climb", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "double_under", name: "Double-under", category: "gymnastics", repSchemes: ["Max Reps"] },
];

const CATEGORIES: { key: LiftCategory; label: string }[] = [
  { key: "olympic", label: "Olympic" },
  { key: "squat", label: "Squat" },
  { key: "press", label: "Press" },
  { key: "pull", label: "Pull" },
  { key: "gymnastics", label: "Gymnastics" },
];

// ═══════════════════════════════════════════════
// Benchmark WOD definitions
// ═══════════════════════════════════════════════

type WodType = "time" | "amrap" | "rounds_time";

interface BenchmarkWOD {
  id: string;
  name: string;
  description: string;
  type: WodType;
  amrapMinutes?: number;
  category: "girl" | "hero" | "open";
}

const BENCHMARK_WODS: BenchmarkWOD[] = [
  // Girl WODs
  { id: "fran", name: "Fran", description: "21-15-9: Thrusters (95/65) & Pull-ups", type: "time", category: "girl" },
  { id: "grace", name: "Grace", description: "30 Clean & Jerks (135/95)", type: "time", category: "girl" },
  { id: "isabel", name: "Isabel", description: "30 Snatches (135/95)", type: "time", category: "girl" },
  { id: "helen", name: "Helen", description: "3 RFT: 400m Run, 21 KB Swings (53/35), 12 Pull-ups", type: "time", category: "girl" },
  { id: "diane", name: "Diane", description: "21-15-9: Deadlifts (225/155) & HSPUs", type: "time", category: "girl" },
  { id: "elizabeth", name: "Elizabeth", description: "21-15-9: Cleans (135/95) & Ring Dips", type: "time", category: "girl" },
  { id: "jackie", name: "Jackie", description: "1000m Row, 50 Thrusters (45/35), 30 Pull-ups", type: "time", category: "girl" },
  { id: "karen", name: "Karen", description: "150 Wall Balls (20/14)", type: "time", category: "girl" },
  { id: "annie", name: "Annie", description: "50-40-30-20-10: Double-unders & Sit-ups", type: "time", category: "girl" },
  { id: "nancy", name: "Nancy", description: "5 RFT: 400m Run, 15 Overhead Squats (95/65)", type: "time", category: "girl" },
  { id: "amanda", name: "Amanda", description: "9-7-5: Muscle-ups & Snatches (135/95)", type: "time", category: "girl" },
  { id: "cindy", name: "Cindy", description: "AMRAP 20: 5 Pull-ups, 10 Push-ups, 15 Squats", type: "amrap", amrapMinutes: 20, category: "girl" },
  { id: "mary", name: "Mary", description: "AMRAP 20: 5 HSPUs, 10 Pistols, 15 Pull-ups", type: "amrap", amrapMinutes: 20, category: "girl" },
  // Hero WODs
  { id: "murph", name: "Murph", description: "1mi Run, 100 Pull-ups, 200 Push-ups, 300 Squats, 1mi Run (w/ vest)", type: "time", category: "hero" },
  { id: "dt", name: "DT", description: "5 RFT: 12 DL (155/105), 9 Hang Cleans, 6 Push Jerks", type: "time", category: "hero" },
  { id: "nate", name: "Nate", description: "AMRAP 20: 2 Muscle-ups, 4 HSPUs, 8 KB Swings (70/53)", type: "amrap", amrapMinutes: 20, category: "hero" },
  { id: "jt", name: "JT", description: "21-15-9: HSPUs, Ring Dips, Push-ups", type: "time", category: "hero" },
  { id: "michael", name: "Michael", description: "3 RFT: 800m Run, 50 Back Ext, 50 Sit-ups", type: "time", category: "hero" },
  { id: "daniel", name: "Daniel", description: "50 Pull-ups, 400m Run, 21 Thrusters (95/65), 800m Run, 21 Thrusters, 400m Run, 50 Pull-ups", type: "time", category: "hero" },
  // Open Classics
  { id: "open_2301", name: "23.1", description: "AMRAP 14: 60 Cal Row, 50 T2B, 40 Wall Balls, 30 Cleans, 20 MU", type: "amrap", amrapMinutes: 14, category: "open" },
  { id: "open_2401", name: "24.1", description: "AMRAP 15: 21-15-9-15-21 Cal Row & Lateral Burpees", type: "amrap", amrapMinutes: 15, category: "open" },
];

const WOD_CATEGORIES: { key: BenchmarkWOD["category"]; label: string }[] = [
  { key: "girl", label: "The Girls" },
  { key: "hero", label: "Hero" },
  { key: "open", label: "Open" },
];

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

function fmtTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function parseTimeInput(str: string): number | null {
  // Accept "m:ss" or total seconds
  const colonMatch = str.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2]);
  const num = parseInt(str);
  if (!isNaN(num) && num > 0) return num;
  return null;
}

interface PRRecord {
  lift: string;
  liftName: string;
  weight: number;
  unit: string;
  scheme: string;
  date: string;
}

function parsePRNotes(notes: string | null): Partial<PRRecord> {
  if (!notes) return {};
  try { return JSON.parse(notes); } catch { return {}; }
}

interface WODRecord {
  wod: string;
  wodName: string;
  type: WodType;
  timeSeconds?: number;
  rounds?: number;
  extraReps?: number;
  rx: boolean;
}

function parseWODNotes(notes: string | null): Partial<WODRecord> {
  if (!notes) return {};
  try { return JSON.parse(notes); } catch { return {}; }
}

// ═══════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════

function TabBar({ active, onChange }: { active: "pr" | "wod"; onChange: (t: "pr" | "wod") => void }) {
  return (
    <div className="flex rounded-xl p-1" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
      {(["pr", "wod"] as const).map((t) => (
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
          {t === "pr" ? "PRs" : "WODs"}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// PR Tab
// ═══════════════════════════════════════════════

function PRTab() {
  const { dateKey } = useToday();
  const [category, setCategory] = useState<LiftCategory>("olympic");
  const [selectedLift, setSelectedLift] = useState<Lift | null>(null);
  const [scheme, setScheme] = useState("1RM");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<"lb" | "kg">("lb");
  const [toast, setToast] = useState<ToastState>("idle");
  const [justSaved, setJustSaved] = useState(false);
  const [recentPRs, setRecentPRs] = useState<ActivityLogRow[]>([]);
  const [prLoading, setPRLoading] = useState(true);

  const liftsInCategory = LIFTS.filter((l) => l.category === category);

  // Load recent PRs
  const loadPRs = useCallback(async () => {
    setPRLoading(true);
    try {
      const to = format(new Date(), "yyyy-MM-dd");
      const from = format(subDays(new Date(), 365), "yyyy-MM-dd");
      const rows = await listActivityLogs({ from, to, activityKey: "pr" as any });
      setRecentPRs(rows);
    } catch { /* empty */ }
    finally { setPRLoading(false); }
  }, []);

  useEffect(() => { void loadPRs(); }, [loadPRs]);

  // When category changes, select first lift
  useEffect(() => {
    const first = liftsInCategory[0] ?? null;
    setSelectedLift(first);
    if (first) setScheme(first.repSchemes[0]);
  }, [category]); // eslint-disable-line

  // When lift changes, reset scheme
  useEffect(() => {
    if (selectedLift && !selectedLift.repSchemes.includes(scheme)) {
      setScheme(selectedLift.repSchemes[0]);
    }
  }, [selectedLift]); // eslint-disable-line

  const handleSave = async () => {
    if (!selectedLift || !weight.trim()) return;
    const num = Number(weight);
    if (isNaN(num) || num <= 0) return;

    setToast("saving");
    try {
      const notes: PRRecord = {
        lift: selectedLift.id,
        liftName: selectedLift.name,
        weight: num,
        unit: weightUnit,
        scheme,
        date: dateKey,
      };
      await addActivityLog({
        dateKey,
        activityKey: "pr" as any,
        value: num,
        unit: "count" as any,
        notes: JSON.stringify(notes),
      });
      hapticSuccess();
      setWeight("");
      setJustSaved(true);
      setToast("saved");
      setTimeout(() => { setToast("idle"); setJustSaved(false); }, 2000);
      void loadPRs();
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  // Build best PR map from recent data
  const bestPRs = new Map<string, PRRecord>();
  for (const row of recentPRs) {
    const data = parsePRNotes(row.notes);
    if (!data.lift || !data.scheme) continue;
    const key = `${data.lift}:${data.scheme}`;
    const existing = bestPRs.get(key);
    if (!existing || (data.weight ?? 0) > (existing.weight ?? 0)) {
      bestPRs.set(key, data as PRRecord);
    }
  }

  return (
    <>
      <Toast state={toast} />

      {/* Category selector */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => { hapticLight(); setCategory(c.key); }}
            className="shrink-0 rounded-lg px-3.5 py-2 text-xs font-bold tracking-wider uppercase transition-all"
            style={{
              background: category === c.key ? "var(--accent-primary)" : "var(--bg-card)",
              color: category === c.key ? "#fff" : "var(--text-muted)",
              border: `1px solid ${category === c.key ? "var(--accent-primary)" : "var(--border-primary)"}`,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Lift selector + form */}
      <section className="card p-5 space-y-4">
        {/* Lift dropdown */}
        <div>
          <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>Lift</label>
          <div className="relative mt-1.5">
            <select
              className="w-full rounded-xl px-4 py-3.5 text-base font-semibold appearance-none pr-10"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
              }}
              value={selectedLift?.id ?? ""}
              onChange={(e) => {
                const lift = LIFTS.find((l) => l.id === e.target.value);
                setSelectedLift(lift ?? null);
              }}
            >
              {liftsInCategory.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
          </div>
        </div>

        {/* Rep scheme */}
        {selectedLift && (
          <div>
            <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>Type</label>
            <div className="flex gap-2 mt-1.5">
              {selectedLift.repSchemes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { hapticLight(); setScheme(s); }}
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    background: scheme === s ? "var(--accent-primary)" : "var(--bg-input)",
                    color: scheme === s ? "#fff" : "var(--text-muted)",
                    border: `1px solid ${scheme === s ? "var(--accent-primary)" : "var(--border-primary)"}`,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Weight input */}
        <div>
          <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>
            {scheme === "Max Reps" ? "Reps" : "Weight"}
          </label>
          <div className="flex gap-2 mt-1.5">
            <input
              className="flex-1 rounded-xl px-4 py-3.5 text-base font-semibold tabular-nums"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
                fontSize: "1.125rem",
              }}
              inputMode="numeric"
              placeholder={scheme === "Max Reps" ? "25" : "225"}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            />
            {scheme !== "Max Reps" && (
              <button
                type="button"
                onClick={() => { hapticLight(); setWeightUnit(weightUnit === "lb" ? "kg" : "lb"); }}
                className="shrink-0 rounded-xl px-4 py-3.5 text-sm font-bold"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-primary)",
                  color: "var(--accent-primary)",
                }}
              >
                {weightUnit}
              </button>
            )}
          </div>
        </div>

        {/* Save */}
        <button type="button" className="btn-primary text-sm w-full flex items-center justify-center gap-2" onClick={handleSave}>
          {justSaved ? <><Check size={16} /> Saved!</> : <><Trophy size={16} /> Log PR</>}
        </button>
      </section>

      {/* PR Board */}
      <section className="card p-4">
        <p className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: "var(--text-faint)" }}>
          PR Board
        </p>
        {prLoading ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>
        ) : bestPRs.size === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No PRs yet. Start logging!</p>
        ) : (
          <div className="space-y-2">
            {Array.from(bestPRs.entries())
              .sort(([, a], [, b]) => a.liftName.localeCompare(b.liftName))
              .map(([key, pr]) => (
                <div key={key} className="flex items-center justify-between py-2 px-1" style={{ borderBottom: "1px solid var(--border-primary)" }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{pr.liftName}</p>
                    <p className="text-xs" style={{ color: "var(--text-faint)" }}>{pr.scheme}</p>
                  </div>
                  <p className="text-base font-bold tabular-nums" style={{ color: "var(--accent-primary)" }}>
                    {pr.scheme === "Max Reps" ? `${pr.weight} reps` : `${pr.weight} ${pr.unit}`}
                  </p>
                </div>
              ))}
          </div>
        )}
      </section>
    </>
  );
}

// ═══════════════════════════════════════════════
// WOD Tab
// ═══════════════════════════════════════════════

function WODTab() {
  const { dateKey } = useToday();
  const [wodCategory, setWodCategory] = useState<BenchmarkWOD["category"]>("girl");
  const [selectedWOD, setSelectedWOD] = useState<BenchmarkWOD | null>(BENCHMARK_WODS[0]);
  const [timeInput, setTimeInput] = useState("");
  const [rounds, setRounds] = useState("");
  const [extraReps, setExtraReps] = useState("");
  const [rx, setRx] = useState(true);
  const [toast, setToast] = useState<ToastState>("idle");
  const [justSaved, setJustSaved] = useState(false);
  const [recentWODs, setRecentWODs] = useState<ActivityLogRow[]>([]);
  const [wodLoading, setWodLoading] = useState(true);

  const wodsInCategory = BENCHMARK_WODS.filter((w) => w.category === wodCategory);

  const loadWODs = useCallback(async () => {
    setWodLoading(true);
    try {
      const to = format(new Date(), "yyyy-MM-dd");
      const from = format(subDays(new Date(), 90), "yyyy-MM-dd");
      const rows = await listActivityLogs({ from, to, activityKey: "wod" as any });
      setRecentWODs(rows);
    } catch { /* empty */ }
    finally { setWodLoading(false); }
  }, []);

  useEffect(() => { void loadWODs(); }, [loadWODs]);

  useEffect(() => {
    const first = wodsInCategory[0] ?? null;
    setSelectedWOD(first);
    setTimeInput("");
    setRounds("");
    setExtraReps("");
  }, [wodCategory]); // eslint-disable-line

  const handleSave = async () => {
    if (!selectedWOD) return;

    let timeSeconds: number | undefined;
    let roundsVal: number | undefined;
    let extraRepsVal: number | undefined;
    let primaryValue: number;

    if (selectedWOD.type === "time") {
      const parsed = parseTimeInput(timeInput);
      if (!parsed) return;
      timeSeconds = parsed;
      primaryValue = parsed;
    } else {
      // AMRAP
      const r = parseInt(rounds);
      if (isNaN(r) || r < 0) return;
      roundsVal = r;
      extraRepsVal = parseInt(extraReps) || 0;
      primaryValue = r * 100 + extraRepsVal; // encoded for sorting
    }

    setToast("saving");
    try {
      const notes: WODRecord = {
        wod: selectedWOD.id,
        wodName: selectedWOD.name,
        type: selectedWOD.type,
        timeSeconds,
        rounds: roundsVal,
        extraReps: extraRepsVal,
        rx,
      };
      await addActivityLog({
        dateKey,
        activityKey: "wod" as any,
        value: primaryValue,
        unit: "count" as any,
        notes: JSON.stringify(notes),
      });
      hapticSuccess();
      setTimeInput("");
      setRounds("");
      setExtraReps("");
      setJustSaved(true);
      setToast("saved");
      setTimeout(() => { setToast("idle"); setJustSaved(false); }, 2000);
      void loadWODs();
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  return (
    <>
      <Toast state={toast} />

      {/* WOD Category selector */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {WOD_CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => { hapticLight(); setWodCategory(c.key); }}
            className="shrink-0 rounded-lg px-3.5 py-2 text-xs font-bold tracking-wider uppercase transition-all"
            style={{
              background: wodCategory === c.key ? "var(--accent-primary)" : "var(--bg-card)",
              color: wodCategory === c.key ? "#fff" : "var(--text-muted)",
              border: `1px solid ${wodCategory === c.key ? "var(--accent-primary)" : "var(--border-primary)"}`,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* WOD Picker */}
      <section className="card p-5 space-y-4">
        <div>
          <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>Workout</label>
          <div className="relative mt-1.5">
            <select
              className="w-full rounded-xl px-4 py-3.5 text-base font-semibold appearance-none pr-10"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
              }}
              value={selectedWOD?.id ?? ""}
              onChange={(e) => {
                const wod = BENCHMARK_WODS.find((w) => w.id === e.target.value);
                setSelectedWOD(wod ?? null);
                setTimeInput("");
                setRounds("");
                setExtraReps("");
              }}
            >
              {wodsInCategory.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
          </div>
        </div>

        {/* WOD description */}
        {selectedWOD && (
          <p className="text-sm leading-relaxed px-1" style={{ color: "var(--text-muted)" }}>
            {selectedWOD.description}
          </p>
        )}

        {/* Time or AMRAP input */}
        {selectedWOD?.type === "time" ? (
          <div>
            <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>Time (m:ss or seconds)</label>
            <input
              className="mt-1.5 w-full rounded-xl px-4 py-3.5 text-base font-semibold tabular-nums"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
                fontSize: "1.125rem",
              }}
              placeholder="3:45"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>Rounds</label>
              <input
                className="mt-1.5 w-full rounded-xl px-4 py-3.5 text-base font-semibold tabular-nums"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-primary)",
                  color: "var(--text-primary)",
                  fontSize: "1.125rem",
                }}
                inputMode="numeric"
                placeholder="20"
                value={rounds}
                onChange={(e) => setRounds(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>+ Reps</label>
              <input
                className="mt-1.5 w-full rounded-xl px-4 py-3.5 text-base font-semibold tabular-nums"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-primary)",
                  color: "var(--text-primary)",
                  fontSize: "1.125rem",
                }}
                inputMode="numeric"
                placeholder="7"
                value={extraReps}
                onChange={(e) => setExtraReps(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Rx toggle */}
        <button
          type="button"
          onClick={() => { hapticLight(); setRx(!rx); }}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all"
          style={{
            background: rx ? "var(--accent-primary)" : "var(--bg-input)",
            color: rx ? "#fff" : "var(--text-muted)",
            border: `1px solid ${rx ? "var(--accent-primary)" : "var(--border-primary)"}`,
          }}
        >
          <Crown size={14} /> {rx ? "Rx'd" : "Scaled"}
        </button>

        {/* Save */}
        <button type="button" className="btn-primary text-sm w-full flex items-center justify-center gap-2" onClick={handleSave}>
          {justSaved ? <><Check size={16} /> Logged!</> : <><Timer size={16} /> Log WOD</>}
        </button>
      </section>

      {/* Recent WODs */}
      <section className="card p-4">
        <p className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: "var(--text-faint)" }}>
          Recent Results
        </p>
        {wodLoading ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>
        ) : recentWODs.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No WODs logged yet.</p>
        ) : (
          <div className="space-y-2">
            {recentWODs.slice(0, 10).map((row) => {
              const data = parseWODNotes(row.notes);
              return (
                <div key={row.id} className="flex items-center justify-between py-2 px-1" style={{ borderBottom: "1px solid var(--border-primary)" }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {data.wodName ?? "WOD"}
                      {data.rx === false && <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--text-faint)" }}>(Scaled)</span>}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-faint)" }}>{row.date}</p>
                  </div>
                  <p className="text-base font-bold tabular-nums" style={{ color: "var(--accent-primary)" }}>
                    {data.type === "time" && data.timeSeconds ? fmtTime(data.timeSeconds) : `${data.rounds ?? 0}+${data.extraReps ?? 0}`}
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
// Main Page
// ═══════════════════════════════════════════════

export default function WODPage() {
  const [tab, setTab] = useState<"pr" | "wod">("pr");

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            🏋️ Barbell & WODs
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Track PRs and benchmark workouts</p>
        </div>
        <Link href="/app/wod/history" className="p-2.5 rounded-xl transition-colors" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <History size={18} style={{ color: "var(--text-muted)" }} />
        </Link>
      </header>

      <TabBar active={tab} onChange={setTab} />

      {tab === "pr" ? <PRTab /> : <WODTab />}
    </div>
  );
}
