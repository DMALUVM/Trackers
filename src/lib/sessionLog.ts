/**
 * sessionLog.ts — Track daily module completions (breathwork, movement, focus)
 *
 * Stores completed sessions in localStorage keyed by date.
 * Today page reads this to show badges on quick-action cards.
 * Each module dispatches a "routines365:sessionComplete" event on finish.
 */

import { tzDateKey } from "@/lib/time";
import { ratingOnModuleComplete } from "@/lib/ratingPrompt";

export type ModuleKey = "breathwork" | "movement" | "focus";

export interface SessionEntry {
  module: ModuleKey;
  name: string;       // e.g. "Box Breathing", "Qigong Foundations", "Deep Work 25"
  minutes: number;    // session duration in minutes
  completedAt: string; // ISO timestamp
}

const LS_PREFIX = "routines365:sessions:";

function todayKey(): string {
  return tzDateKey(new Date());
}

function storageKey(dateKey?: string): string {
  return `${LS_PREFIX}${dateKey ?? todayKey()}`;
}

/** Get all sessions for a given date (defaults to today) */
export function getSessions(dateKey?: string): SessionEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(dateKey));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Get sessions for today, filtered by module */
export function getTodaySessions(module?: ModuleKey): SessionEntry[] {
  const all = getSessions();
  return module ? all.filter((s) => s.module === module) : all;
}

/** Check if a module was completed today */
export function isModuleDoneToday(module: ModuleKey): boolean {
  return getSessions().some((s) => s.module === module);
}

/** Log a completed session and dispatch event */
export function logSession(entry: Omit<SessionEntry, "completedAt">): void {
  const dateKey = todayKey();
  const sessions = getSessions(dateKey);
  const full: SessionEntry = {
    ...entry,
    completedAt: new Date().toISOString(),
  };
  sessions.push(full);
  try {
    localStorage.setItem(storageKey(dateKey), JSON.stringify(sessions));
  } catch { /* quota exceeded — silently skip */ }

  // Dispatch event so Today page can update badges without navigation
  window.dispatchEvent(
    new CustomEvent("routines365:sessionComplete", { detail: full })
  );

  // Trigger rating prompt on 3rd module completion
  ratingOnModuleComplete();
}

/** Get a summary for today: { breathwork: true, movement: false, focus: true } */
export function todayModuleStatus(): Record<ModuleKey, boolean> {
  const sessions = getSessions();
  return {
    breathwork: sessions.some((s) => s.module === "breathwork"),
    movement: sessions.some((s) => s.module === "movement"),
    focus: sessions.some((s) => s.module === "focus"),
  };
}

/** Total session minutes today */
export function todayTotalMinutes(): number {
  return getSessions().reduce((sum, s) => sum + s.minutes, 0);
}

/** Format date as YYYY-MM-DD in local time (not UTC) */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Count sessions for a module this week (Mon-Sun) */
export function weeklyModuleSessions(module: ModuleKey): number {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // Mon=0
  let count = 0;
  for (let i = dow; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dk = localDateKey(d);
    count += getSessions(dk).filter((s) => s.module === module).length;
  }
  return count;
}

/** Count total module sessions this week across all modules */
export function weeklyTotalSessions(): number {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7;
  let count = 0;
  for (let i = dow; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    count += getSessions(localDateKey(d)).length;
  }
  return count;
}
