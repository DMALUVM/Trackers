import { supabase } from "@/lib/supabaseClient";
import type { DayMode, DailyLogRow, RoutineItemRow } from "@/lib/types";
import { tzDateKey } from "@/lib/time";
import { cacheClear, cacheGet, cacheSet } from "@/lib/clientCache";

export function toDateKey(d: Date) {
  return tzDateKey(d);
}

// ---------------------------------------------------------------------------
// Auth helper — uses getSession() (instant, in-memory) instead of getUser()
// (network round-trip). AuthGate already guarantees a valid session before
// any /app route renders, so this is safe and eliminates ~6-10 network
// calls per page navigation.
// ---------------------------------------------------------------------------
let _cachedUserId: string | null = null;

export async function getUserId(): Promise<string> {
  if (_cachedUserId) return _cachedUserId;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      // Session expired — redirect to login if in browser
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/app/")) {
        window.location.replace("/login?next=" + encodeURIComponent(window.location.pathname));
      }
      throw new Error("Not signed in");
    }
    _cachedUserId = session.user.id;
    return _cachedUserId;
  } catch (e) {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/app/")) {
      window.location.replace("/login");
    }
    throw e;
  }
}

// Clear cached userId on sign-out, and flush per-user localStorage
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      _cachedUserId = null;
      cacheClear();
      // Clear all per-user localStorage caches
      try {
        localStorage.removeItem(LS_SETTINGS);
        localStorage.removeItem(LS_ROUTINE_ITEMS);
        localStorage.removeItem("routines365:theme");
      } catch { /* ignore */ }
      // Tell service worker to clear cached data
      try {
        navigator.serviceWorker?.controller?.postMessage("SIGN_OUT");
      } catch { /* ignore */ }
    } else if (event === "SIGNED_IN") {
      // New sign-in — clear stale data from previous user
      _cachedUserId = null;
      cacheClear();
      try {
        localStorage.removeItem(LS_SETTINGS);
        localStorage.removeItem(LS_ROUTINE_ITEMS);
      } catch { /* ignore */ }
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) _cachedUserId = session.user.id;
      });
    } else if (event === "TOKEN_REFRESHED") {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) _cachedUserId = session.user.id;
      });
    }
  });
}

// ---------------------------------------------------------------------------
// localStorage helpers for instant reads (settings, modules)
// ---------------------------------------------------------------------------
const LS_SETTINGS = "routines365:userSettings";
const LS_ROUTINE_ITEMS = "routines365:routineItems";

function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// User Settings
// ---------------------------------------------------------------------------
export type UserSettingsRow = {
  user_id: string;
  enabled_modules: string[];
  theme?: "system" | "dark" | "light";
  timezone?: string;
};

const DEFAULT_ENABLED_MODULES = ["progress", "settings"];

/** Sync browser timezone to user_settings. Call on login + daily. Fails silently. */
export async function syncTimezone() {
  try {
    const userId = await getUserId();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;
    await supabase
      .from("user_settings")
      .upsert({ user_id: userId, timezone: tz }, { onConflict: "user_id" });
  } catch { /* ignore — non-critical */ }
}

/** Synchronous read from localStorage — for instant UI renders. */
export function getUserSettingsSync(): UserSettingsRow | null {
  return lsGet<UserSettingsRow>(LS_SETTINGS);
}

export async function getUserSettings(): Promise<UserSettingsRow> {
  const userId = await getUserId();
  const cacheKey = `user_settings:${userId}`;
  const cached = cacheGet<UserSettingsRow>(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("user_settings")
    .select("user_id,enabled_modules,theme")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  if (!data) {
    const insert = { user_id: userId, enabled_modules: DEFAULT_ENABLED_MODULES, theme: "system" as const };
    const { error: insErr } = await supabase.from("user_settings").insert(insert);
    if (insErr) throw insErr;
    cacheSet(cacheKey, insert, 10 * 60 * 1000);
    lsSet(LS_SETTINGS, insert);
    return insert;
  }

  cacheSet(cacheKey, data as UserSettingsRow, 10 * 60 * 1000);
  lsSet(LS_SETTINGS, data);
  return data as UserSettingsRow;
}

export async function setEnabledModules(enabled: string[]) {
  const userId = await getUserId();
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, enabled_modules: enabled }, { onConflict: "user_id" });
  if (error) throw error;

  cacheClear(`user_settings:${userId}`);
  // Update localStorage immediately for instant nav updates
  const current = lsGet<UserSettingsRow>(LS_SETTINGS);
  if (current) lsSet(LS_SETTINGS, { ...current, enabled_modules: enabled });
  try {
    if (typeof window !== "undefined") window.dispatchEvent(new Event("routines365:userSettingsChanged"));
  } catch { /* ignore */ }
}

export async function setThemePref(theme: "system" | "dark" | "light") {
  const userId = await getUserId();
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, theme }, { onConflict: "user_id" });
  if (error) throw error;

  cacheClear(`user_settings:${userId}`);
  const current = lsGet<UserSettingsRow>(LS_SETTINGS);
  if (current) lsSet(LS_SETTINGS, { ...current, theme });
  try {
    if (typeof window !== "undefined") window.dispatchEvent(new Event("routines365:userSettingsChanged"));
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Routine Items
// ---------------------------------------------------------------------------

/** Synchronous read from localStorage — for instant skeleton avoidance. */
export function listRoutineItemsSync(): RoutineItemRow[] | null {
  return lsGet<RoutineItemRow[]>(LS_ROUTINE_ITEMS);
}

export async function listRoutineItems(): Promise<RoutineItemRow[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user?.id;
  if (!userId) return [];

  const cacheKey = `routine_items:${userId}`;
  const cached = cacheGet<RoutineItemRow[]>(cacheKey);
  if (cached) return cached;

  let { data, error } = await supabase
    .from("routine_items")
    .select(
      "id,user_id,label,emoji,section,is_active,is_non_negotiable,days_of_week,sort_order,created_at"
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  // Fallback: if created_at in select causes issues, retry without it
  if (error) {
    const fallback = await supabase
      .from("routine_items")
      .select(
        "id,user_id,label,emoji,section,is_active,is_non_negotiable,days_of_week,sort_order"
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
    if (fallback.error) throw fallback.error;
    data = fallback.data as typeof data;
    error = null;
  }

  const res = data ?? [];
  cacheSet(cacheKey, res, 5 * 60 * 1000); // 5 min (was 60s)
  lsSet(LS_ROUTINE_ITEMS, res);
  return res;
}

export async function getRoutineItem(id: string): Promise<RoutineItemRow | null> {
  const { data, error } = await supabase
    .from("routine_items")
    .select(
      "id,user_id,label,emoji,section,is_active,is_non_negotiable,days_of_week,sort_order,created_at"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as RoutineItemRow | null) ?? null;
}

export async function updateRoutineItem(
  id: string,
  patch: Partial<
    Pick<
      RoutineItemRow,
      | "label"
      | "emoji"
      | "is_non_negotiable"
      | "days_of_week"
      | "is_active"
      | "section"
      | "sort_order"
    >
  >
) {
  const { error } = await supabase
    .from("routine_items")
    .update(patch)
    .eq("id", id);
  if (error) throw error;

  try {
    if (typeof window !== "undefined") {
      const userId = await getUserId();
      cacheClear(`routine_items:${userId}`);
      window.dispatchEvent(new Event("routines365:routinesChanged"));
    }
  } catch { /* ignore */ }
}

export async function createRoutineItem(opts: {
  label: string;
  emoji?: string | null;
  section?: string;
  isNonNegotiable?: boolean;
  daysOfWeek?: number[] | null;
  sortOrder?: number | null;
}) {
  const userId = await getUserId();
  const { error } = await supabase.from("routine_items").insert({
    user_id: userId,
    label: opts.label,
    emoji: opts.emoji ?? null,
    section: opts.section ?? "anytime",
    is_non_negotiable: opts.isNonNegotiable ?? false,
    days_of_week: opts.daysOfWeek ?? null,
    sort_order: opts.sortOrder ?? null,
  });
  if (error) throw error;

  try {
    if (typeof window !== "undefined") {
      cacheClear(`routine_items:${userId}`);
      window.dispatchEvent(new Event("routines365:routinesChanged"));
    }
  } catch { /* ignore */ }
}

export async function createRoutineItemsBulk(opts: {
  items: Array<{
    label: string;
    emoji?: string | null;
    section?: string;
    isNonNegotiable?: boolean;
    daysOfWeek?: number[] | null;
    sortOrder?: number | null;
  }>;
}) {
  const userId = await getUserId();
  const { error } = await supabase.from("routine_items").insert(
    opts.items.map((it) => ({
      user_id: userId,
      label: it.label,
      emoji: it.emoji ?? null,
      section: it.section ?? "anytime",
      is_non_negotiable: it.isNonNegotiable ?? false,
      days_of_week: it.daysOfWeek ?? null,
      sort_order: it.sortOrder ?? null,
    }))
  );
  if (error) throw error;

  try {
    if (typeof window !== "undefined") {
      cacheClear(`routine_items:${userId}`);
      window.dispatchEvent(new Event("routines365:routinesChanged"));
    }
  } catch { /* ignore */ }
}

export async function upsertDailyLog(opts: {
  dateKey: string;
  dayMode: DayMode;
  sex: boolean | null;
  didRowing: boolean;
  didWeights: boolean;
}) {
  const userId = await getUserId();
  const { error } = await supabase.from("daily_logs").upsert(
    {
      user_id: userId,
      date: opts.dateKey,
      day_mode: opts.dayMode,
      sex: opts.sex,
      did_rowing: opts.didRowing,
      did_weights: opts.didWeights,
    },
    { onConflict: "user_id,date" }
  );
  if (error) throw error;
}

export async function upsertDailyChecks(opts: {
  dateKey: string;
  checks: Array<{ routineItemId: string; done: boolean }>;
}) {
  const userId = await getUserId();
  if (opts.checks.length === 0) return;

  const { error } = await supabase.from("daily_checks").upsert(
    opts.checks.map((c) => ({
      user_id: userId,
      date: opts.dateKey,
      routine_item_id: c.routineItemId,
      done: c.done,
    })),
    { onConflict: "user_id,date,routine_item_id" }
  );
  if (error) throw error;
}

export type DaySnoozeRow = {
  user_id: string;
  date: string;
  routine_item_id: string;
  snoozed_until: string;
};

export async function upsertDaySnooze(opts: {
  dateKey: string;
  routineItemId: string;
  snoozedUntilMs: number;
}) {
  const userId = await getUserId();
  const { error } = await supabase.from("day_snoozes").upsert(
    {
      user_id: userId,
      date: opts.dateKey,
      routine_item_id: opts.routineItemId,
      snoozed_until: new Date(opts.snoozedUntilMs).toISOString(),
    },
    { onConflict: "user_id,date,routine_item_id" }
  );
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Day State — parallelized queries (was 3 sequential round-trips)
// ---------------------------------------------------------------------------
export async function loadDayState(dateKey: string) {
  const userId = await getUserId();

  // Fire all 3 queries in parallel instead of sequentially
  const [logResult, checksResult, snoozesResult] = await Promise.all([
    supabase
      .from("daily_logs")
      .select("date,day_mode,sex,did_rowing,did_weights")
      .eq("user_id", userId)
      .eq("date", dateKey)
      .maybeSingle(),
    supabase
      .from("daily_checks")
      .select("routine_item_id,done")
      .eq("user_id", userId)
      .eq("date", dateKey),
    supabase
      .from("day_snoozes")
      .select("routine_item_id,snoozed_until")
      .eq("user_id", userId)
      .eq("date", dateKey),
  ]);

  if (logResult.error) throw logResult.error;
  if (checksResult.error) throw checksResult.error;
  if (snoozesResult.error) throw snoozesResult.error;

  return {
    log: (logResult.data as DailyLogRow | null) ?? null,
    checks: (checksResult.data ?? []) as Array<{ routine_item_id: string; done: boolean }>,
    snoozes: (snoozesResult.data ?? []) as Array<Pick<DaySnoozeRow, "routine_item_id" | "snoozed_until">>,
  };
}

export async function loadRangeStates(opts: { from: string; to: string }) {
  const userId = await getUserId();

  // Fire both queries in parallel
  const [logsResult, checksResult] = await Promise.all([
    supabase
      .from("daily_logs")
      .select("date,day_mode,sex,did_rowing,did_weights")
      .eq("user_id", userId)
      .gte("date", opts.from)
      .lte("date", opts.to),
    supabase
      .from("daily_checks")
      .select("date,routine_item_id,done")
      .eq("user_id", userId)
      .gte("date", opts.from)
      .lte("date", opts.to),
  ]);

  if (logsResult.error) throw logsResult.error;
  if (checksResult.error) throw checksResult.error;

  return {
    logs: (logsResult.data ?? []) as DailyLogRow[],
    checks: (checksResult.data ?? []) as Array<{
      date: string;
      routine_item_id: string;
      done: boolean;
    }>,
  };
}
