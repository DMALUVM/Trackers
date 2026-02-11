/**
 * Apple HealthKit integration via Capacitor bridge.
 *
 * This module talks to the native Swift HealthKitPlugin
 * via Capacitor's plugin system. Falls back gracefully
 * when running in a browser (non-native).
 */

// ── Types ──

import { tzDateKey } from "@/lib/time";

export interface HealthKitSteps {
  date: string; // YYYY-MM-DD
  steps: number;
}

export interface HealthKitSleep {
  date: string; // YYYY-MM-DD
  /** Total sleep in minutes (asleep time if available, otherwise in-bed) */
  totalMinutes: number;
  /** Actual asleep time in minutes (core + deep + REM) */
  asleepMinutes?: number;
  /** Total in-bed time in minutes */
  inBedMinutes?: number;
  /** Deep sleep minutes (premium) */
  deepMinutes?: number;
  /** Core/light sleep minutes (premium) */
  coreMinutes?: number;
  /** REM sleep minutes (premium) */
  remMinutes?: number;
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
  /** HRV in ms (from Oura, Apple Watch, Garmin, etc.) */
  hrv?: number;
  /** Resting heart rate in bpm */
  restingHeartRate?: number;
}

/** A single day's biometric reading (HRV, RHR, SpO2, etc.) */
export interface BiometricReading {
  date: string;
  value: number;
  min: number;
  max: number;
  samples: number;
}

/** Full biometric summary for a date range */
export interface BiometricSummary {
  hrv: BiometricReading[];
  restingHeartRate: BiometricReading[];
  respiratoryRate: BiometricReading[];
  bloodOxygen: BiometricReading[];
}

// ── Bridge ──

let pluginInstance: Record<string, (...args: unknown[]) => Promise<unknown>> | null | undefined;

function getPlugin(): Record<string, (...args: unknown[]) => Promise<unknown>> | null {
  if (typeof window === "undefined") return null;
  // @ts-expect-error - Capacitor global
  const cap = window.Capacitor;
  if (!cap) return null;

  // Cache lookup
  if (pluginInstance !== undefined) return pluginInstance;

  try {
    // Capacitor registers native plugins on Plugins object
    // Try multiple access patterns for different Capacitor versions
    const p = cap.Plugins?.HealthKitPlugin
      ?? cap.registerPlugin?.("HealthKitPlugin")
      ?? null;
    pluginInstance = p;
    return p;
  } catch {
    pluginInstance = null;
    return null;
  }
}

/** Returns true if running in native app (HealthKit may be available) */
export function isHealthKitAvailable(): boolean {
  if (typeof window === "undefined") return false;
  // @ts-expect-error - Capacitor global
  return !!window.Capacitor;
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
    const result = await plugin.getDaySummary({ date: date ?? tzDateKey(new Date()) }) as { data: HealthKitDaySummary };
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

// ── Biometrics (Premium) ──

/**
 * Get HRV (Heart Rate Variability SDNN) readings.
 * Sourced from Oura Ring, Apple Watch, Garmin, etc. via HealthKit.
 * @param days Number of days to look back (default 30)
 */
export async function getHRV(days = 30): Promise<BiometricReading[]> {
  const plugin = getPlugin();
  if (!plugin) return [];
  try {
    const result = await plugin.getHRV({ days }) as { data: BiometricReading[] };
    return result.data ?? [];
  } catch (e) {
    console.error("HealthKit getHRV error:", e);
    return [];
  }
}

/**
 * Get Resting Heart Rate readings.
 * @param days Number of days to look back (default 30)
 */
export async function getRestingHeartRate(days = 30): Promise<BiometricReading[]> {
  const plugin = getPlugin();
  if (!plugin) return [];
  try {
    const result = await plugin.getRestingHeartRate({ days }) as { data: BiometricReading[] };
    return result.data ?? [];
  } catch (e) {
    console.error("HealthKit getRestingHeartRate error:", e);
    return [];
  }
}

/**
 * Get Respiratory Rate readings.
 * @param days Number of days to look back (default 30)
 */
export async function getRespiratoryRate(days = 30): Promise<BiometricReading[]> {
  const plugin = getPlugin();
  if (!plugin) return [];
  try {
    const result = await plugin.getRespiratoryRate({ days }) as { data: BiometricReading[] };
    return result.data ?? [];
  } catch (e) {
    console.error("HealthKit getRespiratoryRate error:", e);
    return [];
  }
}

/**
 * Get Blood Oxygen (SpO2) readings.
 * @param days Number of days to look back (default 30)
 */
export async function getBloodOxygen(days = 30): Promise<BiometricReading[]> {
  const plugin = getPlugin();
  if (!plugin) return [];
  try {
    const result = await plugin.getBloodOxygen({ days }) as { data: BiometricReading[] };
    return result.data ?? [];
  } catch (e) {
    console.error("HealthKit getBloodOxygen error:", e);
    return [];
  }
}

/**
 * Get all biometric data in one call (more efficient).
 * @param days Number of days to look back (default 30)
 */
export async function getBiometricSummary(days = 30): Promise<BiometricSummary | null> {
  const plugin = getPlugin();
  if (!plugin) return null;
  try {
    const result = await plugin.getBiometricSummary({ days }) as { data: BiometricSummary };
    return result.data ?? null;
  } catch (e) {
    console.error("HealthKit getBiometricSummary error:", e);
    return null;
  }
}
