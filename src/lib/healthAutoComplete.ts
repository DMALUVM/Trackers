/**
 * Smart habit auto-completion via Apple Health data.
 *
 * Checks HealthKit metrics against user's habits and auto-marks
 * them done when thresholds are met. This makes the app feel
 * "intelligent" — you walk 10k steps and your habit checks itself.
 *
 * Matching is keyword-based against habit labels.
 */

import { getTodaySteps, getLastNightSleep, getWorkouts, getTodayCalories, isHealthKitAvailable } from "@/lib/healthKit";

// ── Threshold config ──
// Users can customize these in settings later; defaults are sensible
const LS_KEY = "routines365:healthAutoComplete";

export interface AutoCompleteThresholds {
  steps: number;        // e.g. 10000
  sleepHours: number;   // e.g. 7
  workoutMinutes: number; // e.g. 20 (any workout ≥ this)
  caloriesBurned: number; // e.g. 300
  enabled: boolean;
}

const DEFAULTS: AutoCompleteThresholds = {
  steps: 8000,
  sleepHours: 7,
  workoutMinutes: 20,
  caloriesBurned: 300,
  enabled: true,
};

export function loadThresholds(): AutoCompleteThresholds {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULTS;
}

export function saveThresholds(t: AutoCompleteThresholds) {
  localStorage.setItem(LS_KEY, JSON.stringify(t));
}

// ── Keyword matchers ──
// Each matcher defines: which habit labels it applies to, and what HealthKit check to run

type MatchCategory = "steps" | "sleep" | "workout" | "calories";

const KEYWORD_MAP: Record<MatchCategory, string[]> = {
  steps: ["steps", "walk", "walking", "10k", "10,000", "8k", "8,000", "step goal"],
  sleep: ["sleep", "8 hours", "7 hours", "rest", "bed by", "bedtime"],
  workout: ["workout", "exercise", "gym", "train", "lift", "strength", "cardio", "run", "running", "hiit", "yoga", "swim", "cycling", "bike"],
  calories: ["calories", "burn", "active calories", "cal goal"],
};

function matchCategory(label: string): MatchCategory | null {
  const lower = label.toLowerCase();
  for (const [cat, keywords] of Object.entries(KEYWORD_MAP) as [MatchCategory, string[]][]) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return cat;
    }
  }
  return null;
}

export interface AutoCompleteResult {
  /** habit ID → true if should be auto-completed */
  matches: Map<string, { category: MatchCategory; value: string; threshold: string }>;
  /** Summary for display */
  summary: string[];
}

/**
 * Check all habits against HealthKit data and return which ones
 * should be auto-completed.
 */
export async function checkAutoComplete(
  habits: Array<{ id: string; label: string; done: boolean }>,
  thresholds?: AutoCompleteThresholds,
): Promise<AutoCompleteResult> {
  const t = thresholds ?? loadThresholds();
  const result: AutoCompleteResult = { matches: new Map(), summary: [] };

  if (!t.enabled || !isHealthKitAvailable()) return result;

  // Categorize habits
  const categorized: Array<{ id: string; label: string; done: boolean; category: MatchCategory }> = [];
  for (const h of habits) {
    if (h.done) continue; // Already done, skip
    const cat = matchCategory(h.label);
    if (cat) categorized.push({ ...h, category: cat });
  }

  if (categorized.length === 0) return result;

  // Fetch only what we need
  const needsSteps = categorized.some((h) => h.category === "steps");
  const needsSleep = categorized.some((h) => h.category === "sleep");
  const needsWorkout = categorized.some((h) => h.category === "workout");
  const needsCalories = categorized.some((h) => h.category === "calories");

  const [steps, sleep, workouts, calories] = await Promise.all([
    needsSteps ? getTodaySteps() : 0,
    needsSleep ? getLastNightSleep() : null,
    needsWorkout ? getWorkouts(1) : [],
    needsCalories ? getTodayCalories() : 0,
  ]);

  const sleepHours = sleep ? sleep.totalMinutes / 60 : 0;
  const longestWorkout = workouts.length > 0
    ? Math.max(...workouts.map((w) => w.durationMinutes))
    : 0;

  for (const h of categorized) {
    let met = false;
    let value = "";
    let threshold = "";

    switch (h.category) {
      case "steps":
        met = steps >= t.steps;
        value = `${steps.toLocaleString()} steps`;
        threshold = `${t.steps.toLocaleString()} steps`;
        break;
      case "sleep":
        met = sleepHours >= t.sleepHours;
        value = `${sleepHours.toFixed(1)}h sleep`;
        threshold = `${t.sleepHours}h`;
        break;
      case "workout":
        met = longestWorkout >= t.workoutMinutes;
        value = workouts.length > 0
          ? `${workouts[0].type} · ${longestWorkout}min`
          : "no workout";
        threshold = `${t.workoutMinutes}min`;
        break;
      case "calories":
        met = calories >= t.caloriesBurned;
        value = `${calories} cal`;
        threshold = `${t.caloriesBurned} cal`;
        break;
    }

    if (met) {
      result.matches.set(h.id, { category: h.category, value, threshold });
      result.summary.push(`✅ "${h.label}" — ${value}`);
    }
  }

  return result;
}
