import { format } from "date-fns";
import { supabase } from "@/lib/supabaseClient";
import { getUserId } from "@/lib/supabaseData";

export type ActivityKey = "rowing" | "walking" | "running";
export type ActivityUnit = "meters" | "miles";

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
    .order("date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
