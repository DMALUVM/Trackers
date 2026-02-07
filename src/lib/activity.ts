import { format } from "date-fns";
import { supabase } from "@/lib/supabaseClient";
import { getUserId } from "@/lib/supabaseData";

export type ActivityKey = "rowing" | "walking" | "running" | "sauna" | "cold" | "neuro"
  | "workout" | "sleep_hours" | "supplements" | "meditation" | "hydration";
export type ActivityUnit = "meters" | "minutes" | "miles" | "steps" | "sessions"
  | "hours" | "glasses" | "count";

export function dateKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

type QueuedActivity = {
  dateKey: string;
  activityKey: ActivityKey;
  value: number;
  unit: ActivityUnit;
  notes?: string | null;
  queuedAt: number;
};

const QUEUE_KEY = "routines365:activityQueue";

function readQueue(): QueuedActivity[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as QueuedActivity[];
  } catch {
    return [];
  }
}

function writeQueue(q: QueuedActivity[]) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    window.dispatchEvent(new Event("routines365:activityQueueChanged"));
  } catch {
    // ignore
  }
}

export function getActivityQueueSize() {
  return readQueue().length;
}

export async function flushActivityQueue() {
  const q = readQueue();
  if (q.length === 0) return { flushed: 0, remaining: 0 };

  // best-effort: stop at first failure to preserve order
  let flushed = 0;
  for (let i = 0; i < q.length; i++) {
    const it = q[i];
    try {
      const userId = await getUserId();
      const { error } = await supabase.from("activity_logs").insert({
        user_id: userId,
        date: it.dateKey,
        activity_key: it.activityKey,
        value: it.value,
        unit: it.unit,
        notes: it.notes ?? null,
      });
      if (error) throw error;
      flushed += 1;
    } catch {
      const remaining = q.slice(i);
      writeQueue(remaining);
      return { flushed, remaining: remaining.length };
    }
  }

  writeQueue([]);
  return { flushed, remaining: 0 };
}

export async function addActivityLog(opts: {
  dateKey: string;
  activityKey: ActivityKey;
  value: number;
  unit: ActivityUnit;
  notes?: string | null;
}) {
  try {
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

    // opportunistic flush
    void flushActivityQueue();
  } catch (e) {
    // Offline or transient: queue locally so Today still feels reliable.
    const next = [...readQueue(), { ...opts, queuedAt: Date.now() }];
    writeQueue(next);
    // swallow error so UI can proceed; the queue will sync later
    return;
  }
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
    // PostgREST aggregate; returns [{ sum: <number|null> }]
    .select("sum:value.sum()")
    .eq("user_id", userId)
    .eq("activity_key", opts.activityKey)
    .eq("unit", opts.unit)
    .gte("date", opts.from)
    .lte("date", opts.to);
  if (error) throw error;
  const sum = (data as any)?.[0]?.sum;
  return Number(sum ?? 0);
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
  const ids = (data ?? []).map((r: { id: string }) => r.id).filter(Boolean);
  if (ids.length === 0) return;
  const { error: delErr } = await supabase.from("activity_logs").delete().in("id", ids);
  if (delErr) throw delErr;
}
