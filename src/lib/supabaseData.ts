import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";
import type { DayMode, DailyLogRow, RoutineItemRow } from "@/lib/types";
import { daveSeedRoutineItems, daveSeedWeeklyGoals } from "@/lib/seeds";

export function toDateKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export async function getUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export async function listRoutineItems(): Promise<RoutineItemRow[]> {
  const { data, error } = await supabase
    .from("routine_items")
    .select(
      "id,user_id,label,emoji,section,is_active,is_non_negotiable,days_of_week"
    )
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function ensureSeedData() {
  const userId = await getUserId();

  const items = await listRoutineItems();
  if (items.length === 0) {
    const inserts = daveSeedRoutineItems.map((i) => ({
      user_id: userId,
      label: i.label,
      emoji: i.emoji ?? null,
      section: i.section ?? "anytime",
      is_non_negotiable: i.isNonNegotiable ?? false,
      days_of_week: i.daysOfWeek ?? null,
    }));

    const { error } = await supabase.from("routine_items").insert(inserts);
    if (error) throw error;
  }

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

  return {
    log: (log as DailyLogRow | null) ?? null,
    checks: (checks ?? []) as Array<{ routine_item_id: string; done: boolean }>,
  };
}
