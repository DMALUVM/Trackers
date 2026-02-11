import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This endpoint is called by Vercel Cron every minute.
// It finds reminders due right now and sends push notifications.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidEmail = process.env.VAPID_EMAIL || "mailto:hello@routines365.com";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseServiceKey || !vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  let webpush: typeof import("web-push");
  try {
    webpush = await import("web-push");
  } catch {
    return NextResponse.json({ error: "web-push not installed" }, { status: 500 });
  }

  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${supabaseServiceKey}` } },
  });

  // Current UTC time — we'll match against each user's local time
  const now = new Date();

  // Get all enabled reminders with the user's timezone
  const { data: remindersWithTz, error: remErr } = await supabase
    .from("reminders")
    .select(`
      id, user_id, routine_item_id, time, days_of_week,
      user_settings!inner(timezone)
    `)
    .eq("enabled", true);

  if (remErr) {
    return NextResponse.json({ error: remErr.message }, { status: 500 });
  }

  if (!remindersWithTz || remindersWithTz.length === 0) {
    return NextResponse.json({ sent: 0, checked: 0 });
  }

  // Filter reminders to those due right now in the user's local timezone
  const dueReminders = remindersWithTz.filter((r: any) => {
    const tz = r.user_settings?.timezone || "America/New_York";
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: tz,
      });
      const parts = formatter.formatToParts(now);
      const hour = parts.find((p: any) => p.type === "hour")?.value ?? "00";
      const minute = parts.find((p: any) => p.type === "minute")?.value ?? "00";
      const userTimeStr = `${hour}:${minute}`;

      if (r.time !== userTimeStr) return false;

      // Check day-of-week in user's local timezone
      const localNow = new Date(now.toLocaleString("en-US", { timeZone: tz }));
      const jsDay = localNow.getDay();
      const isoDay = jsDay === 0 ? 7 : jsDay;

      return r.days_of_week.includes(isoDay);
    } catch {
      return false;
    }
  });

  const reminders = dueReminders;

  // Get routine item labels
  const routineItemIds = [...new Set(reminders.map((r: any) => r.routine_item_id))];
  const { data: routineItems } = await supabase
    .from("routine_items")
    .select("id, label, emoji")
    .in("id", routineItemIds);

  const itemMap = new Map<string, { label: string; emoji: string | null }>();
  for (const ri of routineItems ?? []) {
    itemMap.set(ri.id, { label: ri.label, emoji: ri.emoji });
  }

  // Get push subscriptions
  const userIds = [...new Set(reminders.map((r: any) => r.user_id))];
  const { data: subs, error: subErr } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (subErr) {
    return NextResponse.json({ error: subErr.message }, { status: 500 });
  }

  const subsByUser = new Map<string, Array<{ endpoint: string; p256dh: string; auth: string }>>();
  for (const s of subs ?? []) {
    const arr = subsByUser.get(s.user_id) ?? [];
    arr.push({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth });
    subsByUser.set(s.user_id, arr);
  }

  let sent = 0;
  let failed = 0;

  for (const reminder of reminders) {
    const userSubs = subsByUser.get(reminder.user_id);
    if (!userSubs || userSubs.length === 0) continue;

    const item = itemMap.get(reminder.routine_item_id);
    const emoji = item?.emoji ? `${item.emoji} ` : "";
    const label = item?.label ?? "your routine";

    const payload = JSON.stringify({
      title: `${emoji}Reminder`,
      body: `Time for: ${label}`,
      tag: `reminder-${reminder.routine_item_id}`,
      url: "/app/today",
    });

    for (const sub of userSubs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (err: any) {
        failed++;
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", reminder.user_id)
            .eq("endpoint", sub.endpoint);
        }
      }
    }
  }

  return NextResponse.json({ sent, failed, remindersChecked: remindersWithTz.length, remindersDue: dueReminders.length });
}
