import { toDateKey } from "@/lib/supabaseData";

const LS_KEY = "routines365:streakFreezes";

interface FreezeLog {
  /** Dates where freezes were used (YYYY-MM-DD) */
  used: string[];
}

function load(): FreezeLog {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : { used: [] };
  } catch { return { used: [] }; }
}

function save(log: FreezeLog) {
  localStorage.setItem(LS_KEY, JSON.stringify(log));
  // Background sync to Supabase
  void syncFreezesToCloud(log.used);
}

/** How many freezes used this calendar month */
export function freezesUsedThisMonth(): number {
  const log = load();
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return log.used.filter(d => d.startsWith(month)).length;
}

/** Total freezes used all-time */
export function freezesUsedTotal(): number {
  return load().used.length;
}

/** Check if a freeze was used on a specific date */
export function wasFreezeUsed(dateKey: string): boolean {
  return load().used.includes(dateKey);
}

/** Use a freeze for today. Returns true if successful. */
export function useStreakFreeze(isPremium: boolean): boolean {
  const today = toDateKey(new Date());
  const log = load();

  // Already used today?
  if (log.used.includes(today)) return false;

  // Free users: 1 per month
  if (!isPremium) {
    const thisMonth = freezesUsedThisMonth();
    if (thisMonth >= 1) return false;
  }

  log.used.push(today);
  save(log);
  return true;
}

/** Can the user use a freeze right now? */
export function canUseFreeze(isPremium: boolean): boolean {
  const today = toDateKey(new Date());
  const log = load();
  if (log.used.includes(today)) return false;
  if (!isPremium && freezesUsedThisMonth() >= 1) return false;
  return true;
}

/** Get remaining freezes for free users this month */
export function remainingFreezes(isPremium: boolean): number | "unlimited" {
  if (isPremium) return "unlimited";
  return Math.max(0, 1 - freezesUsedThisMonth());
}

// ===========================================================================
// SUPABASE SYNC
// ===========================================================================

async function syncFreezesToCloud(dates: string[]): Promise<void> {
  try {
    const { supabase } = await import("@/lib/supabaseClient");
    const { getUserId } = await import("@/lib/supabaseData");
    const userId = await getUserId();

    await supabase
      .from("user_settings")
      .update({ streak_freeze_dates: dates })
      .eq("user_id", userId);
  } catch {
    // Offline — will sync next time
  }
}

/**
 * Restore freeze dates from Supabase on app load.
 * Merges cloud data with local data (union of both sets).
 */
export async function restoreFreezesFromCloud(): Promise<void> {
  try {
    const { supabase } = await import("@/lib/supabaseClient");
    const { getUserId } = await import("@/lib/supabaseData");
    const userId = await getUserId();

    const { data, error } = await supabase
      .from("user_settings")
      .select("streak_freeze_dates")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data?.streak_freeze_dates) return;

    const cloudDates: string[] = data.streak_freeze_dates;
    const local = load();

    // Merge: union of both
    const merged = new Set([...local.used, ...cloudDates]);
    const mergedArr = [...merged].sort();

    if (mergedArr.length !== local.used.length) {
      save({ used: mergedArr });
    }
  } catch {
    // Offline — silently skip
  }
}
