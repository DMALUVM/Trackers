"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { History, Check, Trophy, Timer, ChevronDown, ChevronUp, Plus } from "lucide-react";
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
  // Olympic
  { id: "clean", name: "Clean", category: "olympic", repSchemes: ["1RM", "3RM"] },
  { id: "power_clean", name: "Power Clean", category: "olympic", repSchemes: ["1RM", "3RM"] },
  { id: "clean_jerk", name: "Clean & Jerk", category: "olympic", repSchemes: ["1RM"] },
  { id: "snatch", name: "Snatch", category: "olympic", repSchemes: ["1RM", "3RM"] },
  { id: "power_snatch", name: "Power Snatch", category: "olympic", repSchemes: ["1RM", "3RM"] },
  { id: "hang_clean", name: "Hang Clean", category: "olympic", repSchemes: ["1RM", "3RM"] },
  { id: "hang_snatch", name: "Hang Snatch", category: "olympic", repSchemes: ["1RM", "3RM"] },
  { id: "squat_clean", name: "Squat Clean", category: "olympic", repSchemes: ["1RM"] },
  { id: "squat_snatch", name: "Squat Snatch", category: "olympic", repSchemes: ["1RM"] },
  { id: "thruster", name: "Thruster", category: "olympic", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "cluster", name: "Cluster", category: "olympic", repSchemes: ["1RM", "3RM"] },
  // Squat
  { id: "back_squat", name: "Back Squat", category: "squat", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "front_squat", name: "Front Squat", category: "squat", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "overhead_squat", name: "Overhead Squat", category: "squat", repSchemes: ["1RM", "3RM"] },
  { id: "goblet_squat", name: "Goblet Squat", category: "squat", repSchemes: ["1RM", "5RM"] },
  { id: "box_squat", name: "Box Squat", category: "squat", repSchemes: ["1RM", "3RM"] },
  // Press
  { id: "strict_press", name: "Strict Press", category: "press", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "push_press", name: "Push Press", category: "press", repSchemes: ["1RM", "3RM"] },
  { id: "push_jerk", name: "Push Jerk", category: "press", repSchemes: ["1RM", "3RM"] },
  { id: "split_jerk", name: "Split Jerk", category: "press", repSchemes: ["1RM"] },
  { id: "bench_press", name: "Bench Press", category: "press", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "incline_bench", name: "Incline Bench", category: "press", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "floor_press", name: "Floor Press", category: "press", repSchemes: ["1RM", "3RM"] },
  { id: "db_press", name: "DB Shoulder Press", category: "press", repSchemes: ["1RM", "5RM"] },
  // Pull
  { id: "deadlift", name: "Deadlift", category: "pull", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "sumo_deadlift", name: "Sumo Deadlift", category: "pull", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "pull_up", name: "Pull-up (weighted)", category: "pull", repSchemes: ["1RM", "3RM"] },
  { id: "pendlay_row", name: "Pendlay Row", category: "pull", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "barbell_row", name: "Barbell Row", category: "pull", repSchemes: ["1RM", "3RM", "5RM"] },
  { id: "romanian_dl", name: "Romanian Deadlift", category: "pull", repSchemes: ["1RM", "3RM", "5RM"] },
  // Gymnastics
  { id: "strict_pull_up", name: "Strict Pull-up", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "kipping_pull_up", name: "Kipping Pull-up", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "chest_to_bar", name: "Chest-to-Bar Pull-up", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "muscle_up_ring", name: "Ring Muscle-up", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "muscle_up_bar", name: "Bar Muscle-up", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "hspu", name: "Handstand Push-up", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "toes_to_bar", name: "Toes-to-Bar", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "double_under", name: "Double-unders", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "rope_climb", name: "Rope Climb", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "legless_rope", name: "Legless Rope Climb", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "pistol_squat", name: "Pistol Squat", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "handstand_walk", name: "Handstand Walk (ft)", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "ghd_situp", name: "GHD Sit-up", category: "gymnastics", repSchemes: ["Max Reps"] },
  { id: "ring_dip", name: "Ring Dip", category: "gymnastics", repSchemes: ["Max Reps"] },
];

// ═══════════════════════════════════════════════
// Data — Benchmark WODs (comprehensive CrossFit)
// ═══════════════════════════════════════════════

type WodType = "time" | "amrap";
type WodCategory = "girl" | "hero" | "other";

interface BenchmarkWOD {
  id: string;
  name: string;
  description: string;
  type: WodType;
  amrapMinutes?: number;
  category: WodCategory;
}

const WOD_CATEGORY_META: Record<WodCategory, { label: string; color: string; softBg: string }> = {
  girl:  { label: "The Girls",  color: "var(--accent-red)",    softBg: "var(--accent-red-soft)" },
  hero:  { label: "Hero",       color: "var(--accent-blue)",   softBg: "var(--accent-blue-soft)" },
  other: { label: "Open/Other", color: "var(--accent-yellow)", softBg: "var(--accent-yellow-soft)" },
};

const BENCHMARK_WODS: BenchmarkWOD[] = [
  // ── The Girls ──
  { id: "fran", name: "Fran", description: "21-15-9: Thrusters (95/65) & Pull-ups", type: "time", category: "girl" },
  { id: "grace", name: "Grace", description: "30 Clean & Jerks (135/95)", type: "time", category: "girl" },
  { id: "isabel", name: "Isabel", description: "30 Snatches (135/95)", type: "time", category: "girl" },
  { id: "helen", name: "Helen", description: "3 RFT: 400m Run, 21 KB Swings (53/35), 12 Pull-ups", type: "time", category: "girl" },
  { id: "diane", name: "Diane", description: "21-15-9: Deadlifts (225/155) & HSPUs", type: "time", category: "girl" },
  { id: "elizabeth", name: "Elizabeth", description: "21-15-9: Cleans (135/95) & Ring Dips", type: "time", category: "girl" },
  { id: "jackie", name: "Jackie", description: "1000m Row, 50 Thrusters (45/35), 30 Pull-ups", type: "time", category: "girl" },
  { id: "karen", name: "Karen", description: "150 Wall Balls (20/14)", type: "time", category: "girl" },
  { id: "annie", name: "Annie", description: "50-40-30-20-10: Double-unders & Sit-ups", type: "time", category: "girl" },
  { id: "nancy", name: "Nancy", description: "5 RFT: 400m Run, 15 OHS (95/65)", type: "time", category: "girl" },
  { id: "amanda", name: "Amanda", description: "9-7-5: Muscle-ups & Snatches (135/95)", type: "time", category: "girl" },
  { id: "angie", name: "Angie", description: "100 Pull-ups, 100 Push-ups, 100 Sit-ups, 100 Squats", type: "time", category: "girl" },
  { id: "barbara", name: "Barbara", description: "5 RFT: 20 Pull-ups, 30 Push-ups, 40 Sit-ups, 50 Squats (3 min rest)", type: "time", category: "girl" },
  { id: "kelly", name: "Kelly", description: "5 RFT: 400m Run, 30 Box Jumps (24/20), 30 Wall Balls (20/14)", type: "time", category: "girl" },
  { id: "eva", name: "Eva", description: "5 RFT: 800m Run, 30 KB Swings (70/53), 30 Pull-ups", type: "time", category: "girl" },
  { id: "chelsea", name: "Chelsea", description: "EMOM 30: 5 Pull-ups, 10 Push-ups, 15 Squats", type: "time", category: "girl" },
  { id: "cindy", name: "Cindy", description: "AMRAP 20: 5 Pull-ups, 10 Push-ups, 15 Squats", type: "amrap", amrapMinutes: 20, category: "girl" },
  { id: "mary", name: "Mary", description: "AMRAP 20: 5 HSPUs, 10 Pistols, 15 Pull-ups", type: "amrap", amrapMinutes: 20, category: "girl" },
  { id: "nicole", name: "Nicole", description: "AMRAP 20: 400m Run, max Pull-ups", type: "amrap", amrapMinutes: 20, category: "girl" },
  { id: "lynne", name: "Lynne", description: "5 rounds: max reps Bench Press (BW) & max Pull-ups", type: "amrap", category: "girl" },
  // ── Hero WODs ──
  { id: "murph", name: "Murph", description: "1mi Run, 100 Pull-ups, 200 Push-ups, 300 Squats, 1mi Run (vest)", type: "time", category: "hero" },
  { id: "dt", name: "DT", description: "5 RFT: 12 DL (155/105), 9 Hang Cleans, 6 Push Jerks", type: "time", category: "hero" },
  { id: "jt", name: "JT", description: "21-15-9: HSPUs, Ring Dips, Push-ups", type: "time", category: "hero" },
  { id: "michael", name: "Michael", description: "3 RFT: 800m Run, 50 Back Extensions, 50 Sit-ups", type: "time", category: "hero" },
  { id: "daniel", name: "Daniel", description: "50 Pull-ups, 400m Run, 21 Thrusters (95/65), 800m Run, 21 Thrusters, 400m Run, 50 Pull-ups", type: "time", category: "hero" },
  { id: "ryan", name: "Ryan", description: "5 RFT: 7 Muscle-ups, 21 Burpees", type: "time", category: "hero" },
  { id: "josh", name: "Josh", description: "21-15-9: OHS (95/65), Pull-ups, Deadlifts (185/135)", type: "time", category: "hero" },
  { id: "tommy_v", name: "Tommy V", description: "21-15-9: Thrusters (115/85) & Rope Climbs", type: "time", category: "hero" },
  { id: "randy", name: "Randy", description: "75 Power Snatches (75/55)", type: "time", category: "hero" },
  { id: "badger", name: "Badger", description: "3 RFT: 30 Squat Cleans (95/65), 30 Pull-ups, 800m Run", type: "time", category: "hero" },
  { id: "lumberjack", name: "Lumberjack 20", description: "20 DL, 400m, 20 KB Swings, 400m, 20 OHS, 400m, 20 Burpees, 400m, 20 C&J, 400m, 20 Box Jumps", type: "time", category: "hero" },
  { id: "pequot", name: "Pequot", description: "10 RFT: 3 HSPUs, 6 C&J (135/95), 12 T2B, 24 Squats", type: "time", category: "hero" },
  { id: "nate", name: "Nate", description: "AMRAP 20: 2 Muscle-ups, 4 HSPUs, 8 KB Swings (70/53)", type: "amrap", amrapMinutes: 20, category: "hero" },
  { id: "griff", name: "Griff", description: "2 RFT: 800m Run, 400m backwards Run, 800m Run, 400m backwards Run", type: "time", category: "hero" },
  { id: "clovis", name: "Clovis", description: "10mi Run. Every 1mi, 20 Burpees", type: "time", category: "hero" },
  // ── Open / Competition / Other ──
  { id: "fight_gone_bad", name: "Fight Gone Bad", description: "3 RFT: 1min each Wall Balls, SDHP, Box Jumps, Push Press, Row Cal (1 min rest)", type: "amrap", amrapMinutes: 17, category: "other" },
  { id: "filthy_fifty", name: "Filthy Fifty", description: "50 each: Box Jumps, Pull-ups, KB Swings, Lunges, K2E, Push Press, Back Ext, Wall Balls, Burpees, DUs", type: "time", category: "other" },
  { id: "kalsu", name: "Kalsu", description: "EMOM 5 Burpees, then max Thrusters (135/95) to 100 total", type: "time", category: "other" },
  { id: "chief", name: "The Chief", description: "5x AMRAP 3: 3 Power Cleans (135/95), 6 Push-ups, 9 Squats (1 min rest)", type: "amrap", category: "other" },
  { id: "seven", name: "Seven", description: "7 RFT: 7 HSPUs, 7 Thrusters (135/95), 7 K2E, 7 DL (245/170), 7 Burpees, 7 KB Swings, 7 Pull-ups", type: "time", category: "other" },
  { id: "king_kong", name: "King Kong", description: "3 RFT: 1 DL (460/315), 2 Muscle-ups, 3 Squat Cleans (250/170), 4 HSPUs", type: "time", category: "other" },
  { id: "open_145", name: "Open 14.5", description: "21-18-15-12-9-6-3: Thrusters (95/65) & Burpees", type: "time", category: "other" },
  { id: "open_165", name: "Open 16.5", description: "21-18-15-12-9-6-3: Thrusters (95/65) & Bar-Facing Burpees", type: "time", category: "other" },
  { id: "open_185", name: "Open 18.5", description: "AMRAP 7: 3 Thrusters + 3 C2B, 6+6, 9+9... (100/70)", type: "amrap", amrapMinutes: 7, category: "other" },
  { id: "sprint_couplet", name: "Sprint Couplet", description: "3 RFT: 10 Power Cleans (135/95), 10 Bar-Facing Burpees", type: "time", category: "other" },
  { id: "nasty_girls", name: "Nasty Girls", description: "3 RFT: 50 Squats, 7 Muscle-ups, 10 Hang Cleans (135/95)", type: "time", category: "other" },
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
// Shared UI
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
  const [reps, setReps] = useState("");
  const [weightUnit, setWeightUnit] = useState<"lb" | "kg">("lb");
  const [toast, setToast] = useState<ToastState>("idle");
  const [justSaved, setJustSaved] = useState(false);
  const [newPR, setNewPR] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");

  const liftsInCategory = LIFTS.filter((l) => l.category === category);
  const catItems = Object.entries(CATEGORY_META).map(([k, v]) => ({ key: k as LiftCategory, ...v }));

  const bestPRs = useMemo(() => {
    const map = new Map<string, PRData>();
    for (const row of allPRs) {
      const d = parseJSON<PRData>(row.notes);
      if (!d.lift || !d.scheme) continue;
      const key = `${d.lift}:${d.scheme}`;
      const existing = map.get(key);
      if (!existing || (d.weight ?? 0) > (existing.weight ?? 0)) map.set(key, d as PRData);
    }
    return map;
  }, [allPRs]);

  const openSheet = (lift: Lift) => {
    hapticMedium();
    setSheetLift(lift);
    setScheme(lift.repSchemes[0]);
    setWeight(""); setReps("");
    setJustSaved(false); setNewPR(false);
  };

  const handleCustomCreate = () => {
    if (!customName.trim()) return;
    const id = `custom_${customName.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    const lift: Lift = { id, name: customName.trim(), category, repSchemes: ["1RM", "3RM", "5RM", "Max Reps"] };
    setShowCustom(false);
    openSheet(lift);
  };

  const handleSave = async () => {
    if (!sheetLift) return;
    const isMax = scheme === "Max Reps";
    const num = Number(isMax ? reps : weight);
    if (isNaN(num) || num <= 0) return;

    const key = `${sheetLift.id}:${scheme}`;
    const prev = bestPRs.get(key);
    const isNewPR = !prev || num > prev.weight;

    setToast("saving");
    try {
      await addActivityLog({
        dateKey, activityKey: "pr" as any, value: num, unit: "count" as any,
        notes: JSON.stringify({ lift: sheetLift.id, liftName: sheetLift.name, weight: num, unit: isMax ? "reps" : weightUnit, scheme } as PRData),
      });
      if (isNewPR) { hapticHeavy(); setNewPR(true); } else { hapticSuccess(); }
      setJustSaved(true); setToast("saved"); reload();
      setTimeout(() => setToast("idle"), 2000);
    } catch { setToast("error"); setTimeout(() => setToast("idle"), 3000); }
  };

  const currentBest = sheetLift ? bestPRs.get(`${sheetLift.id}:${scheme}`) : null;
  const isMax = scheme === "Max Reps";

  return (
    <>
      <Toast state={toast} />
      <CategoryChips active={category} items={catItems} onChange={setCategory} />

      <div className="space-y-2">
        {liftsInCategory.map((lift) => {
          const cat = CATEGORY_META[lift.category];
          const bests = lift.repSchemes.map((s) => bestPRs.get(`${lift.id}:${s}`)).filter(Boolean) as PRData[];
          const topPR = bests.length > 0 ? bests.reduce((a, b) => a.weight > b.weight ? a : b) : null;

          return (
            <button key={lift.id} type="button" onClick={() => openSheet(lift)}
              className="w-full rounded-2xl p-4 text-left flex items-center gap-3 transition-all active:scale-[0.98]"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
              <div className="shrink-0 rounded-full" style={{ width: 10, height: 10, background: cat.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{lift.name}</p>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {lift.repSchemes.map((s) => {
                    const best = bestPRs.get(`${lift.id}:${s}`);
                    return (
                      <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: best ? cat.softBg : "var(--bg-card-hover)", color: best ? cat.color : "var(--text-faint)" }}>
                        {s}{best ? `: ${best.weight}${best.unit === "reps" ? "" : best.unit}` : ""}
                      </span>
                    );
                  })}
                </div>
              </div>
              {topPR && (
                <div className="shrink-0 text-right">
                  <p className="text-xl font-black tabular-nums" style={{ color: cat.color }}>{topPR.weight}</p>
                  <p className="text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>{topPR.unit === "reps" ? "reps" : topPR.unit}</p>
                </div>
              )}
            </button>
          );
        })}

        {/* Add custom lift */}
        <button type="button" onClick={() => { hapticMedium(); setCustomName(""); setShowCustom(true); }}
          className="w-full rounded-2xl p-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{ background: "var(--bg-card)", border: "1.5px dashed var(--border-primary)" }}>
          <Plus size={16} style={{ color: "var(--text-muted)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Add Custom Lift</span>
        </button>
      </div>

      {/* Custom lift name sheet */}
      <BottomSheet open={showCustom} onClose={() => setShowCustom(false)} title="Custom Lift">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>Lift Name</p>
            <input autoFocus className="w-full rounded-xl px-4 py-3 text-base font-bold"
              style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1.5px solid var(--border-primary)" }}
              placeholder="e.g. Turkish Get-Up"
              value={customName} onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomCreate()} />
          </div>
          <button type="button" onClick={handleCustomCreate} disabled={!customName.trim()}
            className="btn-primary w-full py-4 rounded-xl text-base font-bold"
            style={!customName.trim() ? { opacity: 0.5 } : {}}>
            Continue to Log PR
          </button>
        </div>
      </BottomSheet>

      {/* PR entry sheet */}
      <BottomSheet open={!!sheetLift} onClose={() => setSheetLift(null)} title={sheetLift?.name ?? "Log PR"}>
        {sheetLift && (
          <div className="space-y-4">
            {justSaved && newPR && (
              <div className="rounded-xl p-4 text-center" style={{ background: "var(--accent-green-soft)", border: "1px solid var(--accent-green)" }}>
                <p className="text-2xl mb-1">🎉</p>
                <p className="text-sm font-bold" style={{ color: "var(--accent-green)" }}>New Personal Record!</p>
              </div>
            )}
            {justSaved && !newPR && (
              <div className="rounded-xl p-4 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--accent-green)" }}>
                <Check size={20} className="mx-auto mb-1" style={{ color: "var(--accent-green)" }} />
                <p className="text-sm font-bold" style={{ color: "var(--accent-green)" }}>Lift Logged</p>
              </div>
            )}
            {!justSaved && (
              <>
                {/* Rep scheme */}
                <div>
                  <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>Rep Scheme</p>
                  <div className="flex gap-2 flex-wrap">
                    {sheetLift.repSchemes.map((s) => (
                      <button key={s} type="button" onClick={() => { hapticLight(); setScheme(s); }}
                        className="rounded-xl px-4 py-2.5 text-xs font-bold transition-all active:scale-95"
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

                {currentBest && (
                  <div className="rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{ background: "var(--bg-card-hover)", border: "1px solid var(--border-primary)" }}>
                    <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Current Best</span>
                    <span className="text-base font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                      {currentBest.weight} {currentBest.unit === "reps" ? "reps" : currentBest.unit}
                    </span>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>
                    {isMax ? "Reps" : "Weight"}
                  </p>
                  <div className="flex gap-2">
                    <input autoFocus className="flex-1 rounded-xl px-4 py-3.5 text-2xl font-black text-center tabular-nums"
                      style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1.5px solid var(--border-primary)" }}
                      placeholder="0" inputMode="numeric"
                      value={isMax ? reps : weight}
                      onChange={(e) => isMax ? setReps(e.target.value) : setWeight(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSave()} />
                    {!isMax && (
                      <button type="button" onClick={() => { hapticLight(); setWeightUnit((u) => u === "lb" ? "kg" : "lb"); }}
                        className="rounded-xl px-4 py-3.5 text-sm font-bold transition-all active:scale-95"
                        style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1.5px solid var(--border-primary)" }}>
                        {weightUnit}
                      </button>
                    )}
                  </div>
                </div>

                <button type="button" onClick={handleSave}
                  className="btn-primary w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2">
                  <Trophy size={18} /> Log {scheme}
                </button>
              </>
            )}
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
  const [category, setCategory] = useState<WodCategory>("girl");
  const [sheetWOD, setSheetWOD] = useState<BenchmarkWOD | null>(null);
  const [timeInput, setTimeInput] = useState("");
  const [rounds, setRounds] = useState("");
  const [extraReps, setExtraReps] = useState("");
  const [rx, setRx] = useState(true);
  const [toast, setToast] = useState<ToastState>("idle");
  const [justSaved, setJustSaved] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customType, setCustomType] = useState<WodType>("time");

  const wodsInCategory = BENCHMARK_WODS.filter((w) => w.category === category);
  const catItems = Object.entries(WOD_CATEGORY_META).map(([k, v]) => ({ key: k as WodCategory, ...v }));

  const bestWODs = useMemo(() => {
    const map = new Map<string, WODData>();
    for (const row of allWODs) {
      const d = parseJSON<WODData>(row.notes);
      if (!d.wod) continue;
      const existing = map.get(d.wod);
      if (!existing) { map.set(d.wod, d as WODData); continue; }
      if (d.type === "time" && d.timeSeconds && existing.timeSeconds && d.timeSeconds < existing.timeSeconds) map.set(d.wod, d as WODData);
      else if (d.type === "amrap" && (d.rounds ?? 0) > (existing.rounds ?? 0)) map.set(d.wod, d as WODData);
    }
    return map;
  }, [allWODs]);

  const openSheet = (wod: BenchmarkWOD) => {
    hapticMedium();
    setSheetWOD(wod);
    setTimeInput(""); setRounds(""); setExtraReps("");
    setRx(true); setJustSaved(false);
  };

  const handleCustomCreate = () => {
    if (!customName.trim()) return;
    const id = `custom_${customName.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    const wod: BenchmarkWOD = { id, name: customName.trim(), description: customDesc.trim() || "Custom workout", type: customType, category: "other" };
    setShowCustom(false);
    openSheet(wod);
  };

  const handleSave = async () => {
    if (!sheetWOD) return;
    setToast("saving");
    try {
      const notes: WODData = {
        wod: sheetWOD.id, wodName: sheetWOD.name, type: sheetWOD.type, rx,
        ...(sheetWOD.type === "time" ? { timeSeconds: parseTimeInput(timeInput) ?? 0 } : {}),
        ...(sheetWOD.type === "amrap" ? { rounds: parseInt(rounds) || 0, extraReps: parseInt(extraReps) || 0 } : {}),
      };
      await addActivityLog({ dateKey, activityKey: "wod" as any, value: notes.timeSeconds ?? notes.rounds ?? 1, unit: "count" as any, notes: JSON.stringify(notes) });
      hapticSuccess(); setJustSaved(true); setToast("saved"); reload();
      setTimeout(() => setToast("idle"), 2000);
    } catch { setToast("error"); setTimeout(() => setToast("idle"), 3000); }
  };

  const prevBest = sheetWOD ? bestWODs.get(sheetWOD.id) : null;

  return (
    <>
      <Toast state={toast} />
      <CategoryChips active={category} items={catItems} onChange={setCategory} />

      <div className="space-y-2">
        {wodsInCategory.map((wod) => {
          const best = bestWODs.get(wod.id);
          return (
            <button key={wod.id} type="button" onClick={() => openSheet(wod)}
              className="w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{wod.name}</p>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{wod.description}</p>
                  <div className="flex gap-1.5 mt-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "var(--bg-card-hover)", color: "var(--text-faint)" }}>
                      {wod.type === "time" ? "For Time" : wod.amrapMinutes ? `AMRAP ${wod.amrapMinutes}` : "AMRAP"}
                    </span>
                    {best?.rx && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "var(--accent-green-soft)", color: "var(--accent-green)" }}>Rx</span>
                    )}
                  </div>
                </div>
                {best && (
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-black tabular-nums" style={{ color: "var(--accent-red)" }}>
                      {best.type === "time" && best.timeSeconds ? fmtTime(best.timeSeconds) : `${best.rounds ?? 0}+${best.extraReps ?? 0}`}
                    </p>
                    <p className="text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>Best</p>
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {/* Add custom WOD */}
        <button type="button" onClick={() => { hapticMedium(); setCustomName(""); setCustomDesc(""); setCustomType("time"); setShowCustom(true); }}
          className="w-full rounded-2xl p-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{ background: "var(--bg-card)", border: "1.5px dashed var(--border-primary)" }}>
          <Plus size={16} style={{ color: "var(--text-muted)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Add Custom WOD</span>
        </button>
      </div>

      {/* Custom WOD sheet */}
      <BottomSheet open={showCustom} onClose={() => setShowCustom(false)} title="Custom WOD">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>WOD Name</p>
            <input autoFocus className="w-full rounded-xl px-4 py-3 text-base font-bold"
              style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1.5px solid var(--border-primary)" }}
              placeholder="e.g. Box Special" value={customName} onChange={(e) => setCustomName(e.target.value)} />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>Description (optional)</p>
            <input className="w-full rounded-xl px-4 py-3 text-sm"
              style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1.5px solid var(--border-primary)" }}
              placeholder="e.g. 21-15-9 Burpees & Box Jumps" value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>Type</p>
            <div className="flex gap-2">
              {(["time", "amrap"] as const).map((t) => (
                <button key={t} type="button" onClick={() => { hapticLight(); setCustomType(t); }}
                  className="flex-1 rounded-xl py-2.5 text-xs font-bold text-center transition-all active:scale-95"
                  style={{
                    background: customType === t ? "var(--btn-primary-bg)" : "var(--bg-card)",
                    color: customType === t ? "var(--btn-primary-text)" : "var(--text-muted)",
                    border: `1.5px solid ${customType === t ? "var(--btn-primary-bg)" : "var(--border-primary)"}`,
                  }}>
                  {t === "time" ? "For Time" : "AMRAP"}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={handleCustomCreate} disabled={!customName.trim()}
            className="btn-primary w-full py-4 rounded-xl text-base font-bold"
            style={!customName.trim() ? { opacity: 0.5 } : {}}>
            Continue to Log Score
          </button>
        </div>
      </BottomSheet>

      {/* WOD entry sheet */}
      <BottomSheet open={!!sheetWOD} onClose={() => setSheetWOD(null)} title={sheetWOD?.name ?? "Log WOD"}>
        {sheetWOD && (
          <div className="space-y-4">
            {justSaved ? (
              <div className="rounded-xl p-4 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--accent-green)" }}>
                <Check size={20} className="mx-auto mb-1" style={{ color: "var(--accent-green)" }} />
                <p className="text-sm font-bold" style={{ color: "var(--accent-green)" }}>Score Logged</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl p-3" style={{ background: "var(--bg-card-hover)" }}>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{sheetWOD.description}</p>
                </div>

                {prevBest && (
                  <div className="rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{ background: "var(--bg-card-hover)", border: "1px solid var(--border-primary)" }}>
                    <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Previous Best</span>
                    <span className="text-base font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                      {prevBest.type === "time" && prevBest.timeSeconds ? fmtTime(prevBest.timeSeconds) : `${prevBest.rounds ?? 0}+${prevBest.extraReps ?? 0}`}
                      {prevBest.rx ? " Rx" : " Scaled"}
                    </span>
                  </div>
                )}

                {sheetWOD.type === "time" ? (
                  <div>
                    <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>Time (m:ss)</p>
                    <input autoFocus className="w-full rounded-xl px-4 py-3.5 text-2xl font-black text-center tabular-nums"
                      style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1.5px solid var(--border-primary)" }}
                      placeholder="0:00" value={timeInput} onChange={(e) => setTimeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSave()} />
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>Rounds</p>
                      <input autoFocus className="w-full rounded-xl px-4 py-3.5 text-2xl font-black text-center tabular-nums"
                        style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1.5px solid var(--border-primary)" }}
                        placeholder="0" inputMode="numeric" value={rounds} onChange={(e) => setRounds(e.target.value)} />
                    </div>
                    <div className="flex items-end pb-1"><span className="text-xl font-bold" style={{ color: "var(--text-faint)" }}>+</span></div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-faint)" }}>Reps</p>
                      <input className="w-full rounded-xl px-4 py-3.5 text-2xl font-black text-center tabular-nums"
                        style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1.5px solid var(--border-primary)" }}
                        placeholder="0" inputMode="numeric" value={extraReps} onChange={(e) => setExtraReps(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSave()} />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {[true, false].map((isRx) => (
                    <button key={String(isRx)} type="button" onClick={() => { hapticLight(); setRx(isRx); }}
                      className="flex-1 rounded-xl py-2.5 text-xs font-bold text-center transition-all active:scale-95"
                      style={{
                        background: rx === isRx ? (isRx ? "var(--accent-green-soft)" : "var(--accent-yellow-soft)") : "var(--bg-card)",
                        color: rx === isRx ? (isRx ? "var(--accent-green)" : "var(--accent-yellow)") : "var(--text-muted)",
                        border: `1.5px solid ${rx === isRx ? (isRx ? "var(--accent-green)" : "var(--accent-yellow)") : "var(--border-primary)"}`,
                      }}>
                      {isRx ? "Rx\u2019d" : "Scaled"}
                    </button>
                  ))}
                </div>

                <button type="button" onClick={handleSave}
                  className="btn-primary w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2">
                  <Timer size={18} /> Log Score
                </button>
              </>
            )}
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
      setAllPRs(prs); setAllWODs(wods);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  return (
    <div className="space-y-5">
      {/* Header — pr-12 avoids SettingsGear overlap */}
      <header>
        <div className="flex items-center justify-between pr-12">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            🏋️ Barbell & WODs
          </h1>
          <Link href="/app/wod/history"
            className="tap-btn shrink-0 flex items-center justify-center rounded-full"
            style={{ width: 36, height: 36, background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
            <History size={16} style={{ color: "var(--text-muted)" }} />
          </Link>
        </div>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>Track PRs and benchmark workouts</p>
      </header>

      <TabBar active={tab} tabs={[{ key: "pr", label: "PRs" }, { key: "wod", label: "Benchmarks" }]} onChange={setTab} />

      {tab === "pr"
        ? <PRTab allPRs={allPRs} reload={loadAll} />
        : <BenchmarksTab allWODs={allWODs} reload={loadAll} />}
    </div>
  );
}
