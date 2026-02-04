import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";
import type { DayMode, DailyLogRow, RoutineItemRow } from "@/lib/types";
import { daveSeedRoutineItems, daveSeedWeeklyGoals } from "@/lib/seeds";
import { tzDateKey } from "@/lib/time";

export function toDateKey(d: Date) {
  // Normalize to app timezone (America/New_York) so "days" don't drift while traveling.
  return tzDateKey(d);
}

export async function getUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export type UserSettingsRow = {
  user_id: string;
  enabled_modules: string[];
};

const DEFAULT_ENABLED_MODULES = ["progress", "rowing", "settings"];

export async function getUserSettings(): Promise<UserSettingsRow> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("user_settings")
    .select("user_id,enabled_modules")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    // Create default settings row
    const insert = { user_id: userId, enabled_modules: DEFAULT_ENABLED_MODULES };
    const { error: insErr } = await supabase.from("user_settings").insert(insert);
    if (insErr) throw insErr;
    return insert;
  }
  return data as UserSettingsRow;
}

export async function setEnabledModules(enabled: string[]) {
  const userId = await getUserId();
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, enabled_modules: enabled }, { onConflict: "user_id" });
  if (error) throw error;
}

export async function listRoutineItems(): Promise<RoutineItemRow[]> {
  const { data, error } = await supabase
    .from("routine_items")
    .select(
      "id,user_id,label,emoji,section,is_active,is_non_negotiable,days_of_week,sort_order"
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
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
}

export async function ensureSeedData() {
  const userId = await getUserId();

  // IMPORTANT: do NOT auto-seed routine_items for new users.
  // Onboarding should ask users what they want to track.
  // Dave's personal routines are already in his account and remain untouched.
  const items = await listRoutineItems();
  void items;

  // weekly goals
  const { data: goals, error: goalsErr } = await supabase
    .from("weekly_goals")
    .select("id,key,target_per_week")
    .eq("is_active", true);
  if (goalsErr) throw goalsErr;
  if ((goals ?? []).length === 0) {
    const goalInserts = daveSeedWeeklyGoals.map((g) => ({
      user_id: userId,
      key: g.key,
      target_per_week: g.targetPerWeek,
    }));
    const { error } = await supabase.from("weekly_goals").insert(goalInserts);
    if (error) throw error;
  }
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
  date: string; // yyyy-mm-dd
  routine_item_id: string;
  snoozed_until: string; // ISO timestamp
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

export async function loadDayState(dateKey: string) {
  const userId = await getUserId();

  const { data: log, error: logErr } = await supabase
    .from("daily_logs")
    .select("date,day_mode,sex,did_rowing,did_weights")
    .eq("user_id", userId)
    .eq("date", dateKey)
    .maybeSingle();
  if (logErr) throw logErr;

  const { data: checks, error: checksErr } = await supabase
    .from("daily_checks")
    .select("routine_item_id,done")
    .eq("user_id", userId)
    .eq("date", dateKey);
  if (checksErr) throw checksErr;

  const { data: snoozes, error: snoozesErr } = await supabase
    .from("day_snoozes")
    .select("routine_item_id,snoozed_until")
    .eq("user_id", userId)
    .eq("date", dateKey);
  if (snoozesErr) throw snoozesErr;

  return {
    log: (log as DailyLogRow | null) ?? null,
    checks: (checks ?? []) as Array<{ routine_item_id: string; done: boolean }>,
    snoozes: (snoozes ?? []) as Array<Pick<DaySnoozeRow, "routine_item_id" | "snoozed_until">>,
  };
}

export async function loadRangeStates(opts: { from: string; to: string }) {
  const userId = await getUserId();

  const { data: logs, error: logsErr } = await supabase
    .from("daily_logs")
    .select("date,day_mode,sex,did_rowing,did_weights")
    .eq("user_id", userId)
    .gte("date", opts.from)
    .lte("date", opts.to);
  if (logsErr) throw logsErr;

  const { data: checks, error: checksErr } = await supabase
    .from("daily_checks")
    .select("date,routine_item_id,done")
    .eq("user_id", userId)
    .gte("date", opts.from)
    .lte("date", opts.to);
  if (checksErr) throw checksErr;

  return {
    logs: (logs ?? []) as DailyLogRow[],
    checks: (checks ?? []) as Array<{
      date: string;
      routine_item_id: string;
      done: boolean;
    }>,
  };
}
