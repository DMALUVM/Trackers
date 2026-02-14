"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { History, Check, Trophy, Timer, Crown, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useToday } from "@/lib/hooks";
import { addActivityLog, listActivityLogs, type ActivityLogRow } from "@/lib/activity";
import { Toast, BottomSheet, type ToastState } from "@/app/app/_components/ui";
import { hapticSuccess, hapticLight, hapticMedium, hapticHeavy, hapticSelection } from "@/lib/haptics";
import { format, subDays } from "date-fns";

// ═══════════════════════════════════════════════
// Data — Lifts
// ═══════════════════════════════════════════════

type LiftCategory = "olympic" | "squat" | "press" | "pull" | "gymnastics";

interface Lift {
  id: string;
  name: string;
  category: LiftCategory;
  repSchemes: string[];
}

const CATEGORY_META: Record<LiftCategory, { label: string; color: string; softBg: string }> = {
  olympic:    { label: "Olympic",     color: "var(--accent-red)",    softBg: "var(--accent-red-soft)" },
  squat:      { label: "Squat",       color: "var(--accent-blue)",   softBg: "var(--accent-blue-soft)" },
  press:      { label: "Press",       color: "var(--accent-yellow)", softBg: "var(--accent-yellow-soft)" },
  pull:       { label: "Pull",        color: "var(--accent-green)",  softBg: "var(--accent-green-soft)" },
  gymnastics: { label: "Gymnastics",  color: "#a78bfa",             softBg: "rgba(167,139,250,0.15)" },
};

const LIFTS: Lift[] = [
  { id: "clean", name: "Clean", category: "olympic", repSchemes: ["1RM", "3RM"] },
  { id: "power_clean", name: "Power Clean", category: "olympic", repSchemes: ["1RM", "3RM"] },
  { id: "clean_jerk", name: "Clean & Jerk", category: "olympic", repSchemes: ["1RM"] },
  { id: "snatch", name: "Snatch", category: "olympic", repSchemes: ["1RM", "3RM"] },
  { id: "power_snatch", name: "Power Snatch", category: "olympic", repSchemes: ["1RM", "3RM"] },
  { id: "hang_clean", name: "Hang Clean", category: "olympic", repSchemes: ["1RM", "3RM"] },
  { id: "hang_snatch", name: "Hang Snatch", category: "olympic", repSchemes: ["1RM", "3RM"] },
  { id: "thruster", name: "Thruster", category: "olympic", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "back_squat", name: "Back Squat", category: "squat", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "front_squat", name: "Front Squat", category: "squat", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "overhead_squat", name: "Overhead Squat", category: "squat", repSchemes: ["1RM", "3RM"] },
  { id: "strict_press", name: "Strict Press", category: "press", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "push_press", name: "Push Press", category: "press", repSchemes: ["1RM", "3RM"] },
  { id: "push_jerk", name: "Push Jerk", category: "press", repSchemes: ["1RM", "3RM"] },
  { id: "split_jerk", name: "Split Jerk", category: "press", repSchemes: ["1RM"] },
  { id: "bench_press", name: "Bench Press", category: "press", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "deadlift", name: "Deadlift", category: "pull", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "sumo_deadlift", name: "Sumo Deadlift", category: "pull", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "pull_up", name: "Pull-up (weighted)", category: "pull", repSchemes: ["1RM", "3RM"] },
  { id: "strict_pull_up", name: "Strict Pull-up", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "muscle_up_ring", name: "Ring Muscle-up", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "muscle_up_bar", name: "Bar Muscle-up", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "hspu", name: "Handstand Push-up", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "toes_to_bar", name: "Toes-to-Bar", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "double_under", name: "Double-unders", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "rope_climb", name: "Rope Climb", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "pistol_squat", name: "Pistol Squat", category: "gymnastics", repSchemes: ["Max Reps"] },
];

// ═══════════════════════════════════════════════
// Data — Benchmark WODs
// ═══════════════════════════════════════════════

type WodType = "time" | "amrap";
type WodCategory = "girl" | "hero" | "open";

interface BenchmarkWOD {
  id: string;
  name: string;
  description: string;
  type: WodType;
  amrapMinutes?: number;
  category: WodCategory;
}

const WOD_CATEGORY_META: Record<WodCategory, { label: string; color: string; softBg: string }> = {
  girl: { label: "The Girls",  color: "var(--accent-red)",    softBg: "var(--accent-red-soft)" },
  hero: { label: "Hero",       color: "var(--accent-blue)",   softBg: "var(--accent-blue-soft)" },
  open: { label: "Open",       color: "var(--accent-yellow)", softBg: "var(--accent-yellow-soft)" },
};

const BENCHMARK_WODS: BenchmarkWOD[] = [
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
  { id: "murph", name: "Murph", description: "1mi Run, 100 Pull-ups, 200 Push-ups, 300 Squats, 1mi Run (vest)", type: "time", category: "hero" },
  { id: "dt", name: "DT", description: "5 RFT: 12 DL (155/105), 9 Hang Cleans, 6 Push Jerks", type: "time", category: "hero" },
  { id: "nate", name: "Nate", description: "AMRAP 20: 2 Muscle-ups, 4 HSPUs, 8 KB Swings (70/53)", type: "amrap", amrapMinutes: 20, category: "hero" },
  { id: "jt", name: "JT", description: "21-15-9: HSPUs, Ring Dips, Push-ups", type: "time", category: "hero" },
  { id: "michael", name: "Michael", description: "3 RFT: 800m Run, 50 Back Ext, 50 Sit-ups", type: "time", category: "hero" },
  { id: "daniel", name: "Daniel", description: "50 Pull-ups, 400m, 21 Thrusters, 800m, 21 Thrusters, 400m, 50 Pull-ups", type: "time", category: "hero" },
];

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function parseTimeInput(str: string): number | null {
  const c = str.match(/^(\d+):(\d{1,2})$/);
  if (c) return parseInt(c[1]) * 60 + parseInt(c[2]);
  const n = parseInt(str);
  return !isNaN(n) && n > 0 ? n : null;
}

interface PRData { lift: string; liftName: string; weight: number; unit: string; scheme: string; }
interface WODData { wod: string; wodName: string; type: WodType; timeSeconds?: number; rounds?: number; extraReps?: number; rx: boolean; }

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
// Shared: Category Chips
// ═══════════════════════════════════════════════

function CategoryChips<T extends string>({ active, items, onChange }: {
  active: T; items: { key: T; label: string; color: string; softBg: string }[]; onChange: (k: T) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
      {items.map((c) => (
        <button key={c.key} type="button"
          onClick={() => { hapticLight(); onChange(c.key); }}
          className="shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95"
          style={{
            background: active === c.key ? c.softBg : "var(--bg-card)",
            color: active === c.key ? c.color : "var(--text-faint)",
            border: `1.5px solid ${active === c.key ? c.color : "var(--border-primary)"}`,
          }}>
          {c.label}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// PR Tab
// ═══════════════════════════════════════════════

function PRTab({ allPRs, reload }: { allPRs: ActivityLogRow[]; reload: () => void }) {
  const { dateKey } = useToday();
  const [category, setCategory] = useState<LiftCategory>("olympic");
  const [sheetLift, setSheetLift] = useState<Lift | null>(null);
  const [scheme, setScheme] = useState("1RM");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<"lb" | "kg">("lb");
  const [toast, setToast] = useState<ToastState>("idle");
  const [justSaved, setJustSaved] = useState(false);
  const [newPR, setNewPR] = useState(false);

  const liftsInCategory = LIFTS.filter((l) => l.category === category);
  const catItems = Object.entries(CATEGORY_META).map(([k, v]) => ({ key: k as LiftCategory, ...v }));

  // Build best-PR lookup: "liftId:scheme" → PRData
  const bestPRs = useMemo(() => {
    const map = new Map<string, PRData>();
    for (const row of allPRs) {
      const d = parseJSON<PRData>(row.notes);
      if (!d.lift || !d.scheme) continue;
      const key = `${d.lift}:${d.scheme}`;
      const existing = map.get(key);
      if (!existing || (d.weight ?? 0) > (existing.weight ?? 0)) {
        map.set(key, d as PRData);
      }
    }
    return map;
  }, [allPRs]);

  const openSheet = (lift: Lift) => {
    hapticMedium();
    setSheetLift(lift);
    setScheme(lift.repSchemes[0]);
    setWeight("");
    setJustSaved(false);
    setNewPR(false);
  };

  const handleSave = async () => {
    if (!sheetLift || !weight.trim()) return;
    const num = Number(weight);
    if (isNaN(num) || num <= 0) return;

    // Check if it's a new PR
    const key = `${sheetLift.id}:${scheme}`;
    const prev = bestPRs.get(key);
    const isNewPR = !prev || num > prev.weight;

    setToast("saving");
    try {
      const notes: PRData = {
        lift: sheetLift.id, liftName: sheetLift.name,
        weight: num, unit: weightUnit, scheme,
      };
      await addActivityLog({
        dateKey, activityKey: "pr" as any,
        value: num, unit: "count" as any,
        notes: JSON.stringify(notes),
      });

      if (isNewPR) {
        hapticHeavy();
        setNewPR(true);
      } else {
        hapticSuccess();
      }
      setJustSaved(true);
      setToast("saved");
      reload();
      setTimeout(() => { setToast("idle"); }, 2000);
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  const currentBest = sheetLift ? bestPRs.get(`${sheetLift.id}:${scheme}`) : null;

  return (
    <>
      <Toast state={toast} />

      <CategoryChips active={category} items={catItems} onChange={setCategory} />

      {/* Lift cards */}
      <div className="space-y-2">
        {liftsInCategory.map((lift) => {
          const cat = CATEGORY_META[lift.category];
          // Find best across all schemes
          const bests = lift.repSchemes
            .map((s) => bestPRs.get(`${lift.id}:${s}`))
            .filter(Boolean) as PRData[];
          const topPR = bests.length > 0 ? bests.reduce((a, b) => a.weight > b.weight ? a : b) : null;

          return (
            <button key={lift.id} type="button"
              onClick={() => openSheet(lift)}
              className="w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 rounded-full" style={{ width: 8, height: 8, background: cat.color }} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{lift.name}</p>
                    <div className="flex gap-1.5 mt-1">
                      {lift.repSchemes.map((s) => {
                        const pr = bestPRs.get(`${lift.id}:${s}`);
                        return (
                          <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: pr ? cat.softBg : "var(--bg-card-hover)",
                              color: pr ? cat.color : "var(--text-faint)",
                            }}>
                            {s}{pr ? `: ${pr.scheme === "Max Reps" ? `${pr.weight}` : `${pr.weight}${pr.unit}`}` : ""}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {topPR && (
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-lg font-black tabular-nums" style={{ color: cat.color }}>
                      {topPR.weight}
                    </p>
                    <p className="text-[10px] font-semibold" style={{ color: "var(--text-faint)" }}>
                      {topPR.scheme === "Max Reps" ? "reps" : topPR.unit}
                    </p>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── PR Entry Bottom Sheet ── */}
      <BottomSheet open={!!sheetLift} onClose={() => setSheetLift(null)} title={sheetLift?.name ?? "Log PR"}>
        {sheetLift && (
          <div className="space-y-5">
            {/* New PR celebration */}
            {newPR && (
              <div className="rounded-2xl p-4 text-center"
                style={{ background: "var(--accent-yellow-soft)", border: "1px solid var(--accent-yellow)" }}>
                <p className="text-2xl mb-1">🎉</p>
                <p className="text-base font-black" style={{ color: "var(--accent-yellow)" }}>New Personal Record!</p>
              </div>
            )}

            {/* Rep scheme selector */}
            <div>
              <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>Type</p>
              <div className="flex gap-2">
                {sheetLift.repSchemes.map((s) => (
                  <button key={s} type="button"
                    onClick={() => { hapticLight(); setScheme(s); setJustSaved(false); setNewPR(false); }}
                    className="flex-1 rounded-xl py-3 text-sm font-bold text-center transition-all active:scale-95"
                    style={{
                      background: scheme === s ? "var(--btn-primary-bg)" : "var(--bg-card)",
                      color: scheme === s ? "var(--btn-primary-text)" : "var(--text-muted)",
                      border: `1.5px solid ${scheme === s ? "var(--btn-primary-bg)" : "var(--border-primary)"}`,
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Current best */}
            {currentBest && !newPR && (
              <div className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: "var(--bg-card-hover)" }}>
                <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Current best</p>
                <p className="text-base font-black tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {currentBest.scheme === "Max Reps" ? `${currentBest.weight} reps` : `${currentBest.weight} ${currentBest.unit}`}
                </p>
              </div>
            )}

            {/* Weight/reps input */}
            <div>
              <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>
                {scheme === "Max Reps" ? "Reps completed" : "Weight"}
              </p>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl px-4 py-4 text-center text-xl font-black tabular-nums"
                  style={{
                    background: "var(--bg-input)", border: "1.5px solid var(--border-primary)",
                    color: "var(--text-primary)",
                  }}
                  inputMode="numeric"
                  placeholder={scheme === "Max Reps" ? "25" : "225"}
                  value={weight}
                  onChange={(e) => { setWeight(e.target.value); setJustSaved(false); setNewPR(false); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                  autoFocus
                />
                {scheme !== "Max Reps" && (
                  <button type="button"
                    onClick={() => { hapticLight(); setWeightUnit(weightUnit === "lb" ? "kg" : "lb"); }}
                    className="shrink-0 rounded-xl px-5 py-4 text-base font-black transition-all active:scale-95"
                    style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-primary)", color: "var(--text-primary)" }}>
                    {weightUnit}
                  </button>
                )}
              </div>
            </div>

            {/* Save */}
            <button type="button" onClick={handleSave}
              disabled={justSaved}
              className="btn-primary w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2"
              style={justSaved ? { opacity: 0.6 } : {}}>
              {justSaved
                ? <><Check size={18} /> {newPR ? "PR Saved!" : "Logged!"}</>
                : <><Trophy size={18} /> Log {scheme === "Max Reps" ? "Reps" : "PR"}</>}
            </button>
          </div>
        )}
      </BottomSheet>
    </>
  );
}

// ═══════════════════════════════════════════════
// Benchmarks Tab
// ═══════════════════════════════════════════════

function BenchmarksTab({ allWODs, reload }: { allWODs: ActivityLogRow[]; reload: () => void }) {
  const { dateKey } = useToday();
  const [wodCategory, setWodCategory] = useState<WodCategory>("girl");
  const [sheetWOD, setSheetWOD] = useState<BenchmarkWOD | null>(null);
  const [timeInput, setTimeInput] = useState("");
  const [rounds, setRounds] = useState("");
  const [extraReps, setExtraReps] = useState("");
  const [rx, setRx] = useState(true);
  const [toast, setToast] = useState<ToastState>("idle");
  const [justSaved, setJustSaved] = useState(false);

  const wodsInCategory = BENCHMARK_WODS.filter((w) => w.category === wodCategory);
  const catItems = Object.entries(WOD_CATEGORY_META).map(([k, v]) => ({ key: k as WodCategory, ...v }));

  // Build best-WOD lookup
  const bestWODs = useMemo(() => {
    const map = new Map<string, WODData>();
    for (const row of allWODs) {
      const d = parseJSON<WODData>(row.notes);
      if (!d.wod) continue;
      const existing = map.get(d.wod);
      if (!existing) { map.set(d.wod, d as WODData); continue; }
      // For time: lower is better. For AMRAP: higher is better.
      if (d.type === "time" && d.timeSeconds && existing.timeSeconds && d.timeSeconds < existing.timeSeconds) {
        map.set(d.wod, d as WODData);
      } else if (d.type === "amrap") {
        const score = (d.rounds ?? 0) * 1000 + (d.extraReps ?? 0);
        const existScore = (existing.rounds ?? 0) * 1000 + (existing.extraReps ?? 0);
        if (score > existScore) map.set(d.wod, d as WODData);
      }
    }
    return map;
  }, [allWODs]);

  const openSheet = (wod: BenchmarkWOD) => {
    hapticMedium();
    setSheetWOD(wod);
    setTimeInput("");
    setRounds("");
    setExtraReps("");
    setRx(true);
    setJustSaved(false);
  };

  const handleSave = async () => {
    if (!sheetWOD) return;
    let timeSeconds: number | undefined;
    let roundsVal: number | undefined;
    let extraRepsVal: number | undefined;
    let primaryValue: number;

    if (sheetWOD.type === "time") {
      const parsed = parseTimeInput(timeInput);
      if (!parsed) return;
      timeSeconds = parsed;
      primaryValue = parsed;
    } else {
      const r = parseInt(rounds);
      if (isNaN(r) || r < 0) return;
      roundsVal = r;
      extraRepsVal = parseInt(extraReps) || 0;
      primaryValue = r * 1000 + extraRepsVal;
    }

    setToast("saving");
    try {
      const notes: WODData = {
        wod: sheetWOD.id, wodName: sheetWOD.name,
        type: sheetWOD.type, timeSeconds, rounds: roundsVal, extraReps: extraRepsVal, rx,
      };
      await addActivityLog({
        dateKey, activityKey: "wod" as any,
        value: primaryValue, unit: "count" as any,
        notes: JSON.stringify(notes),
      });
      hapticSuccess();
      setJustSaved(true);
      setToast("saved");
      reload();
      setTimeout(() => setToast("idle"), 2000);
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  const currentBest = sheetWOD ? bestWODs.get(sheetWOD.id) : null;

  return (
    <>
      <Toast state={toast} />

      <CategoryChips active={wodCategory} items={catItems} onChange={setWodCategory} />

      {/* WOD cards */}
      <div className="space-y-3">
        {wodsInCategory.map((wod) => {
          const cat = WOD_CATEGORY_META[wod.category];
          const best = bestWODs.get(wod.id);
          const bestStr = best
            ? best.type === "time" && best.timeSeconds ? fmtTime(best.timeSeconds) : `${best.rounds ?? 0}+${best.extraReps ?? 0}`
            : null;

          return (
            <button key={wod.id} type="button"
              onClick={() => openSheet(wod)}
              className="w-full rounded-2xl p-5 text-left transition-all active:scale-[0.98]"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <p className="text-base font-black" style={{ color: "var(--text-primary)" }}>{wod.name}</p>
                    {best?.rx === false && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "var(--bg-card-hover)", color: "var(--text-faint)" }}>Scaled</span>
                    )}
                  </div>
                  <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>{wod.description}</p>
                  <div className="flex gap-2 mt-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: cat.softBg, color: cat.color }}>
                      {wod.type === "time" ? "For Time" : `AMRAP ${wod.amrapMinutes}`}
                    </span>
                  </div>
                </div>
                {bestStr && (
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-faint)" }}>Best</p>
                    <p className="text-lg font-black tabular-nums mt-0.5" style={{ color: "var(--accent-green)" }}>{bestStr}</p>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── WOD Entry Bottom Sheet ── */}
      <BottomSheet open={!!sheetWOD} onClose={() => setSheetWOD(null)} title={sheetWOD?.name ?? "Log WOD"}>
        {sheetWOD && (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{sheetWOD.description}</p>

            {/* Previous best */}
            {currentBest && (
              <div className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: "var(--bg-card-hover)" }}>
                <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Previous best</p>
                <p className="text-base font-black tabular-nums" style={{ color: "var(--accent-green)" }}>
                  {currentBest.type === "time" && currentBest.timeSeconds
                    ? fmtTime(currentBest.timeSeconds)
                    : `${currentBest.rounds ?? 0}+${currentBest.extraReps ?? 0}`}
                  {currentBest.rx === false ? " (Scaled)" : ""}
                </p>
              </div>
            )}

            {/* Time input or AMRAP input */}
            {sheetWOD.type === "time" ? (
              <div>
                <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>
                  Time (m:ss)
                </p>
                <input
                  className="w-full rounded-xl px-4 py-4 text-center text-xl font-black tabular-nums"
                  style={{ background: "var(--bg-input)", border: "1.5px solid var(--border-primary)", color: "var(--text-primary)" }}
                  placeholder="3:45"
                  value={timeInput}
                  onChange={(e) => { setTimeInput(e.target.value); setJustSaved(false); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                  autoFocus
                />
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>
                  Score (rounds + reps)
                </p>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold mb-1 text-center" style={{ color: "var(--text-faint)" }}>Rounds</p>
                    <input
                      className="w-full rounded-xl px-4 py-4 text-center text-xl font-black tabular-nums"
                      style={{ background: "var(--bg-input)", border: "1.5px solid var(--border-primary)", color: "var(--text-primary)" }}
                      inputMode="numeric" placeholder="20" value={rounds}
                      onChange={(e) => { setRounds(e.target.value); setJustSaved(false); }}
                      autoFocus
                    />
                  </div>
                  <p className="text-xl font-black pb-4" style={{ color: "var(--text-faint)" }}>+</p>
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold mb-1 text-center" style={{ color: "var(--text-faint)" }}>Reps</p>
                    <input
                      className="w-full rounded-xl px-4 py-4 text-center text-xl font-black tabular-nums"
                      style={{ background: "var(--bg-input)", border: "1.5px solid var(--border-primary)", color: "var(--text-primary)" }}
                      inputMode="numeric" placeholder="7" value={extraReps}
                      onChange={(e) => { setExtraReps(e.target.value); setJustSaved(false); }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Rx toggle */}
            <div className="flex rounded-2xl p-1" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
              {([
                { key: true, label: "Rx'd", icon: "👑" },
                { key: false, label: "Scaled", icon: "📏" },
              ] as const).map(({ key, label, icon }) => (
                <button key={String(key)} type="button"
                  onClick={() => { hapticLight(); setRx(key); }}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-center transition-all duration-200"
                  style={{
                    background: rx === key ? "var(--btn-primary-bg)" : "transparent",
                    color: rx === key ? "var(--btn-primary-text)" : "var(--text-muted)",
                  }}>
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Save */}
            <button type="button" onClick={handleSave}
              disabled={justSaved}
              className="btn-primary w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2"
              style={justSaved ? { opacity: 0.6 } : {}}>
              {justSaved
                ? <><Check size={18} /> Logged!</>
                : <><Timer size={18} /> Log Result</>}
            </button>
          </div>
        )}
      </BottomSheet>
    </>
  );
}

// ═══════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════

export default function WODPage() {
  const [tab, setTab] = useState("pr");
  const [allPRs, setAllPRs] = useState<ActivityLogRow[]>([]);
  const [allWODs, setAllWODs] = useState<ActivityLogRow[]>([]);

  const loadAll = useCallback(async () => {
    try {
      const to = format(new Date(), "yyyy-MM-dd");
      const from = format(subDays(new Date(), 730), "yyyy-MM-dd");
      const [prs, wods] = await Promise.all([
        listActivityLogs({ from, to, activityKey: "pr" as any }),
        listActivityLogs({ from, to, activityKey: "wod" as any }),
      ]);
      setAllPRs(prs);
      setAllWODs(wods);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            🏋️ Barbell & WODs
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>Track PRs and benchmark workouts</p>
        </div>
        <Link href="/app/wod/history"
          className="tap-btn shrink-0 flex items-center justify-center rounded-full"
          style={{ width: 40, height: 40, background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <History size={18} style={{ color: "var(--text-muted)" }} />
        </Link>
      </header>

      <TabBar active={tab} tabs={[{ key: "pr", label: "PRs" }, { key: "wod", label: "Benchmarks" }]} onChange={setTab} />

      {tab === "pr"
        ? <PRTab allPRs={allPRs} reload={loadAll} />
        : <BenchmarksTab allWODs={allWODs} reload={loadAll} />}
    </div>
  );
}
