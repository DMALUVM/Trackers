// ---------------------------------------------------------------------------
// Centralised constants — replace every hardcoded "Dave-ism" with a single
// source of truth so the app is ready for public, user-configurable values.
// ---------------------------------------------------------------------------

/** Category keywords used for streak detection. */
export const CATEGORY_KEYWORDS = {
  movement: ["walk", "workout", "exercise", "rowing", "stretch", "mobility", "move", "run", "swim", "bike", "hike", "yoga"],
  mind: ["breath", "meditat", "journal", "neuro", "mind", "read", "pray", "gratitude"],
  sleep: ["sleep", "bedtime", "wind down"],
} as const;

/** Labels that satisfy the generic "workout" requirement. */
export const WORKOUT_ALIASES = ["workout", "exercise", "strength", "lift", "gym"] as const;

/** Activity types that can be logged with metrics. */
export const METRIC_ACTIVITIES: Record<
  string,
  { key: string; title: string; emoji: string; fields: Array<{ name: string; unit: string; inputMode: string; placeholder: string; required?: boolean }> }
> = {
  rowing: {
    key: "rowing",
    title: "Rowing",
    emoji: "🚣",
    fields: [
      { name: "meters", unit: "meters", inputMode: "numeric", placeholder: "5000", required: true },
      { name: "minutes", unit: "minutes", inputMode: "decimal", placeholder: "20" },
    ],
  },
  running: {
    key: "running",
    title: "Running",
    emoji: "🏃",
    fields: [{ name: "miles", unit: "miles", inputMode: "decimal", placeholder: "2.5", required: true }],
  },
  walking: {
    key: "walking",
    title: "Walking",
    emoji: "🚶",
    fields: [{ name: "steps", unit: "steps", inputMode: "numeric", placeholder: "8500", required: true }],
  },
  sauna: {
    key: "sauna",
    title: "Sauna",
    emoji: "🔥",
    fields: [{ name: "sessions", unit: "sessions", inputMode: "numeric", placeholder: "1", required: true }],
  },
  cold: {
    key: "cold",
    title: "Cold plunge",
    emoji: "❄️",
    fields: [{ name: "sessions", unit: "sessions", inputMode: "numeric", placeholder: "1", required: true }],
  },
  sleep: {
    key: "sleep",
    title: "Sleep",
    emoji: "😴",
    fields: [
      { name: "hours", unit: "hours", inputMode: "decimal", placeholder: "7.5", required: true },
      { name: "score", unit: "score", inputMode: "numeric", placeholder: "85" },
    ],
  },
  hydration: {
    key: "hydration",
    title: "Hydration",
    emoji: "💧",
    fields: [
      { name: "glasses", unit: "glasses", inputMode: "numeric", placeholder: "8", required: true },
    ],
  },
};

/** Map a routine label to a metric activity key (if any). */
export function labelToMetricKey(label: string): string | null {
  const l = label.toLowerCase();
  if (l.includes("rowing") || l.includes("row")) return "rowing";
  if (l.includes("run")) return "running";
  if (l.includes("walk")) return "walking";
  if (l.includes("sauna")) return "sauna";
  if (l.includes("cold")) return "cold";
  if (l.includes("sleep")) return "sleep";
  if (l.includes("water") || l.includes("hydrat")) return "hydration";
  return null;
}

/** Check if a label satisfies the generic "workout" requirement. */
export function isWorkoutLabel(label: string): boolean {
  const l = label.toLowerCase();
  return WORKOUT_ALIASES.some((a) => l.includes(a));
}

/** Debounce delay for auto-save (ms). */
export const AUTOSAVE_DELAY_MS = 350;

/** Number of days of history to load for streak calculations. */
export const STREAK_LOOKBACK_DAYS = 90;

/** Default timezone for date normalisation. */


/** Snooze duration — "skip today" means hide for 24 hours. */
export const SNOOZE_DURATION_MS = 24 * 60 * 60 * 1000;
