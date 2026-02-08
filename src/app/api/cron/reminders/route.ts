import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

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
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  // Configure web-push
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

  // Admin client — bypasses RLS
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Current time in HH:MM and ISO day-of-week
  // Note: reminders store time in user's local timezone, but we process
  // in UTC. For v1, we'll check the current UTC time. For production,
  // you'd want to group users by timezone.
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/New_York", // TODO: per-user timezone
  });
  const isoDay = now.getDay() === 0 ? 7 : now.getDay(); // JS: 0=Sun → ISO: 7=Sun

  // Find reminders due now
  const { data: reminders, error: remErr } = await supabase
    .from("reminders")
    .select(`
      id,
      user_id,
      routine_item_id,
      time,
      days_of_week,
      routine_items!inner(label, emoji)
    `)
    .eq("enabled", true)
    .eq("time", timeStr)
    .contains("days_of_week", [isoDay]);

  if (remErr) {
    console.error("Failed to query reminders:", remErr);
    return NextResponse.json({ error: remErr.message }, { status: 500 });
  }

  if (!reminders || reminders.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Get unique user IDs
  const userIds = [...new Set(reminders.map((r: any) => r.user_id))];

  // Fetch push subscriptions for these users
  const { data: subs, error: subErr } = await supabase
    .from("push_subscriptions")
    .select("user_id,endpoint,p256dh,auth")
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

  // Send notifications
  let sent = 0;
  let failed = 0;

  for (const reminder of reminders) {
    const userSubs = subsByUser.get(reminder.user_id);
    if (!userSubs || userSubs.length === 0) continue;

    const item = (reminder as any).routine_items;
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
      } catch (err: any) {
        failed++;
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

  return NextResponse.json({ sent, failed, remindersChecked: reminders.length });
}
