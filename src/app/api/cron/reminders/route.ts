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
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseServiceKey || !vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: "Missing env vars", details: {
      hasServiceKey: !!supabaseServiceKey,
      hasVapidPublic: !!vapidPublicKey,
      hasVapidPrivate: !!vapidPrivateKey,
    }}, { status: 500 });
  }

  // Dynamically import web-push (avoids build issues if not installed)
  let webpush: typeof import("web-push");
  try {
    webpush = await import("web-push");
  } catch {
    return NextResponse.json({ error: "web-push package not installed. Run: npm install web-push" }, { status: 500 });
  }

  // Configure web-push
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

  // Admin client — must explicitly disable auth to bypass RLS with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`[CRON] Supabase URL: ${supabaseUrl?.slice(0, 30)}...`);
  console.log(`[CRON] Service key starts with: ${supabaseServiceKey?.slice(0, 10)}...`);

  // Current time in HH:MM (24h) and ISO day-of-week
  // Using America/New_York — adjust to your timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/New_York",
  });
  const parts = formatter.formatToParts(now);
  const hour = parts.find(p => p.type === "hour")?.value ?? "00";
  const minute = parts.find(p => p.type === "minute")?.value ?? "00";
  const timeStr = `${hour}:${minute}`; // "06:00" format matching <input type="time">

  // Get ISO day of week in ET
  const etNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const jsDay = etNow.getDay(); // 0=Sun
  const isoDay = jsDay === 0 ? 7 : jsDay; // ISO: 1=Mon … 7=Sun

  console.log(`[CRON] Checking reminders for time=${timeStr} day=${isoDay} (UTC=${now.toISOString()})`);

  // First, log ALL reminders for debugging
  const { data: allReminders, error: debugErr } = await supabase
    .from("reminders")
    .select("id, time, days_of_week, enabled")
    .eq("enabled", true);
  console.log(`[CRON] All enabled reminders (${allReminders?.length ?? 0}):`, JSON.stringify(allReminders));
  if (debugErr) console.error(`[CRON] Debug query error:`, debugErr);

  // Find enabled reminders matching this time
  const { data: reminders, error: remErr } = await supabase
    .from("reminders")
    .select("id, user_id, routine_item_id, time, days_of_week")
    .eq("enabled", true)
    .eq("time", timeStr)
    .contains("days_of_week", [isoDay]);

  console.log(`[CRON] Matched reminders: ${reminders?.length ?? 0}`);

  if (remErr) {
    console.error("Failed to query reminders:", remErr);
    return NextResponse.json({ error: remErr.message }, { status: 500 });
  }

  if (!reminders || reminders.length === 0) {
    return NextResponse.json({ sent: 0, time: timeStr, day: isoDay, allReminders: allReminders?.map(r => ({ time: r.time, days: r.days_of_week })) });
  }

  // Get routine item labels for notification text
  const routineItemIds = [...new Set(reminders.map((r: any) => r.routine_item_id))];
  const { data: routineItems } = await supabase
    .from("routine_items")
    .select("id, label, emoji")
    .in("id", routineItemIds);

  const itemMap = new Map<string, { label: string; emoji: string | null }>();
  for (const ri of routineItems ?? []) {
    itemMap.set(ri.id, { label: ri.label, emoji: ri.emoji });
  }

  // Get unique user IDs and fetch push subscriptions
  const userIds = [...new Set(reminders.map((r: any) => r.user_id))];
  const { data: subs, error: subErr } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (subErr) {
    console.error("Failed to query push subscriptions:", subErr);
    return NextResponse.json({ error: subErr.message }, { status: 500 });
  }

  // Group subscriptions by user
  const subsByUser = new Map<string, Array<{ endpoint: string; p256dh: string; auth: string }>>();
  for (const s of subs ?? []) {
    const arr = subsByUser.get(s.user_id) ?? [];
    arr.push({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth });
    subsByUser.set(s.user_id, arr);
  }

  console.log(`[CRON] Found ${subs?.length ?? 0} push subscriptions for ${userIds.length} users`);

  // Send notifications
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

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
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        sent++;
        console.log(`[CRON] ✅ Sent to ${sub.endpoint.slice(0, 60)}...`);
      } catch (err: any) {
        failed++;
        console.error(`[CRON] ❌ Failed: ${err.statusCode} ${err.body ?? err.message}`);
        errors.push(`${err.statusCode ?? "?"}: ${err.body ?? err.message ?? "unknown"}`);
        // Remove expired/invalid subscriptions
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

  return NextResponse.json({
    sent,
    failed,
    remindersChecked: reminders.length,
    time: timeStr,
    day: isoDay,
    errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
  });
}
