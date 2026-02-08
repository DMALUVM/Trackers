/**
 * Apple HealthKit integration via Capacitor bridge.
 *
 * This module talks to the native Swift HealthKitPlugin
 * via Capacitor's plugin system. Falls back gracefully
 * when running in a browser (non-native).
 */

// ── Types ──

export interface HealthKitSteps {
  date: string; // YYYY-MM-DD
  steps: number;
}

export interface HealthKitSleep {
  date: string; // YYYY-MM-DD
  /** Total sleep in minutes */
  totalMinutes: number;
  /** Bed time as ISO string */
  bedTime: string | null;
  /** Wake time as ISO string */
  wakeTime: string | null;
}

export interface HealthKitWorkout {
  date: string;
  /** Workout type (e.g. "Running", "Strength Training") */
  type: string;
  /** Duration in minutes */
  durationMinutes: number;
  /** Active calories burned */
  calories: number;
}

export interface HealthKitDaySummary {
  date: string;
  steps: number;
  activeCalories: number;
  sleepMinutes: number;
  bedTime: string | null;
  wakeTime: string | null;
  workouts: HealthKitWorkout[];
}

// ── Bridge ──

function getPlugin(): Record<string, (...args: unknown[]) => Promise<unknown>> | null {
  if (typeof window === "undefined") return null;
  // @ts-expect-error - Capacitor global
  const cap = window.Capacitor;
  if (!cap?.Plugins?.HealthKitPlugin) return null;
  return cap.Plugins.HealthKitPlugin;
}

/** Returns true if HealthKit is available (native app on iPhone) */
export function isHealthKitAvailable(): boolean {
  return !!getPlugin();
}

/**
 * Request HealthKit authorization.
 * Must be called before reading any data.
 * Returns true if authorized.
 */
export async function requestHealthKitAuth(): Promise<boolean> {
  const plugin = getPlugin();
  if (!plugin) return false;
  try {
    const result = await plugin.requestAuthorization() as { authorized: boolean };
    return result.authorized;
  } catch (e) {
    console.error("HealthKit auth error:", e);
    return false;
  }
}

/**
 * Check if HealthKit authorization has been granted.
 */
export async function isHealthKitAuthorized(): Promise<boolean> {
  const plugin = getPlugin();
  if (!plugin) return false;
  try {
    const result = await plugin.isAuthorized() as { authorized: boolean };
    return result.authorized;
  } catch {
    return false;
  }
}

/**
 * Get step counts for a date range.
 * @param days Number of days to look back (default 7)
 */
export async function getSteps(days = 7): Promise<HealthKitSteps[]> {
  const plugin = getPlugin();
  if (!plugin) return [];
  try {
    const result = await plugin.getSteps({ days }) as { data: HealthKitSteps[] };
    return result.data ?? [];
  } catch (e) {
    console.error("HealthKit getSteps error:", e);
    return [];
  }
}

/**
 * Get today's step count.
 */
export async function getTodaySteps(): Promise<number> {
  const data = await getSteps(1);
  return data[0]?.steps ?? 0;
}

/**
 * Get sleep data for a date range.
 * @param days Number of days to look back (default 7)
 */
export async function getSleep(days = 7): Promise<HealthKitSleep[]> {
  const plugin = getPlugin();
  if (!plugin) return [];
  try {
    const result = await plugin.getSleep({ days }) as { data: HealthKitSleep[] };
    return result.data ?? [];
  } catch (e) {
    console.error("HealthKit getSleep error:", e);
    return [];
  }
}

/**
 * Get last night's sleep data.
 */
export async function getLastNightSleep(): Promise<HealthKitSleep | null> {
  const data = await getSleep(1);
  return data[0] ?? null;
}

/**
 * Get workout data for a date range.
 * @param days Number of days to look back (default 7)
 */
export async function getWorkouts(days = 7): Promise<HealthKitWorkout[]> {
  const plugin = getPlugin();
  if (!plugin) return [];
  try {
    const result = await plugin.getWorkouts({ days }) as { data: HealthKitWorkout[] };
    return result.data ?? [];
  } catch (e) {
    console.error("HealthKit getWorkouts error:", e);
    return [];
  }
}

/**
 * Get a full day summary (steps, calories, sleep, workouts).
 */
export async function getDaySummary(date?: string): Promise<HealthKitDaySummary | null> {
  const plugin = getPlugin();
  if (!plugin) return null;
  try {
    const result = await plugin.getDaySummary({ date: date ?? new Date().toISOString().slice(0, 10) }) as { data: HealthKitDaySummary };
    return result.data ?? null;
  } catch (e) {
    console.error("HealthKit getDaySummary error:", e);
    return null;
  }
}

/**
 * Get active calories burned today.
 */
export async function getTodayCalories(): Promise<number> {
  const summary = await getDaySummary();
  return summary?.activeCalories ?? 0;
}
