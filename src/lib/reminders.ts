import { supabase } from "@/lib/supabaseClient";
import { getUserId } from "@/lib/supabaseData";
import { cacheGet, cacheSet, cacheClear } from "@/lib/clientCache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type Reminder = {
  id: string;
  user_id: string;
  routine_item_id: string;
  time: string;        // "HH:MM"
  days_of_week: number[]; // ISO: 1=Mon … 7=Sun
  enabled: boolean;
};

// ---------------------------------------------------------------------------
// Reminder CRUD
// ---------------------------------------------------------------------------
const CACHE_KEY = "reminders:all";

export async function listReminders(): Promise<Reminder[]> {
  const cached = cacheGet<Reminder[]>(CACHE_KEY);
  if (cached) return cached;

  const userId = await getUserId();
  const { data, error } = await supabase
    .from("reminders")
    .select("id,user_id,routine_item_id,time,days_of_week,enabled")
    .eq("user_id", userId);
  if (error) throw error;

  const result = (data ?? []) as Reminder[];
  cacheSet(CACHE_KEY, result, 5 * 60 * 1000);
  return result;
}

export async function upsertReminder(opts: {
  routineItemId: string;
  time: string;
  daysOfWeek: number[];
  enabled: boolean;
}): Promise<Reminder> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("reminders")
    .upsert(
      {
        user_id: userId,
        routine_item_id: opts.routineItemId,
        time: opts.time,
        days_of_week: opts.daysOfWeek,
        enabled: opts.enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,routine_item_id" }
    )
    .select("id,user_id,routine_item_id,time,days_of_week,enabled")
    .single();
  if (error) throw error;

  cacheClear(CACHE_KEY);
  return data as Reminder;
}

export async function deleteReminder(routineItemId: string) {
  const userId = await getUserId();
  const { error } = await supabase
    .from("reminders")
    .delete()
    .eq("user_id", userId)
    .eq("routine_item_id", routineItemId);
  if (error) throw error;
  cacheClear(CACHE_KEY);
}

// ---------------------------------------------------------------------------
// Push Subscription Management
// ---------------------------------------------------------------------------

// VAPID public key — set this in your env as NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function isPushSupported(): Promise<boolean> {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    !!VAPID_PUBLIC_KEY
  );
}

export async function getPushPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  return Notification.permission;
}

export async function subscribeToPush(): Promise<boolean> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Store subscription in Supabase
    const userId = await getUserId();
    const subJson = sub.toJSON();
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: sub.endpoint,
        p256dh: subJson.keys?.p256dh ?? "",
        auth: subJson.keys?.auth ?? "",
      },
      { onConflict: "user_id,endpoint" }
    );
    if (error) throw error;

    return true;
  } catch (e) {
    console.error("Push subscription failed:", e);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const userId = await getUserId();
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId)
        .eq("endpoint", sub.endpoint);
      await sub.unsubscribe();
    }
  } catch (e) {
    console.error("Push unsubscribe failed:", e);
  }
}
