import { format } from "date-fns";
import { supabase } from "@/lib/supabaseClient";
import { getUserId } from "@/lib/supabaseData";

export type ActivityKey = "rowing" | "walking" | "running" | "sauna" | "cold" | "neuro";
export type ActivityUnit = "meters" | "minutes" | "miles" | "steps" | "sessions";

export function dateKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export async function addActivityLog(opts: {
  dateKey: string;
  activityKey: ActivityKey;
  value: number;
  unit: ActivityUnit;
  notes?: string | null;
}) {
  const userId = await getUserId();
  const { error } = await supabase.from("activity_logs").insert({
    user_id: userId,
    date: opts.dateKey,
    activity_key: opts.activityKey,
    value: opts.value,
    unit: opts.unit,
    notes: opts.notes ?? null,
  });
  if (error) throw error;
}

export async function sumActivity(opts: {
  from: string;
  to: string;
  activityKey: ActivityKey;
  unit: ActivityUnit;
}) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("value")
    .eq("user_id", userId)
    .eq("activity_key", opts.activityKey)
    .eq("unit", opts.unit)
    .gte("date", opts.from)
    .lte("date", opts.to);
  if (error) throw error;
  return (data ?? []).reduce((sum, row: any) => sum + Number(row.value ?? 0), 0);
}

export type ActivityLogRow = {
  id: string;
  date: string;
  activity_key: string;
  value: number;
  unit: string;
  notes: string | null;
};

export async function listActivityLogs(opts: {
  from: string;
  to: string;
  activityKey: ActivityKey;
}) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id,date,activity_key,value,unit,notes")
    .eq("user_id", userId)
    .eq("activity_key", opts.activityKey)
    .gte("date", opts.from)
    .lte("date", opts.to)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ActivityLogRow[];
}

export async function deleteActivityLog(id: string) {
  const { error } = await supabase.from("activity_logs").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteActivityLogsForDate(opts: {
  dateKey: string;
  activityKey: ActivityKey;
}) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("activity_key", opts.activityKey)
    .eq("date", opts.dateKey);
  if (error) throw error;
  const ids = (data ?? []).map((r: any) => r.id).filter(Boolean);
  if (ids.length === 0) return;
  const { error: delErr } = await supabase.from("activity_logs").delete().in("id", ids);
  if (delErr) throw delErr;
}
