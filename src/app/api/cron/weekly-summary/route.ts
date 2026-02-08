import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Runs Sunday at 8pm ET — sends a weekly recap push notification.

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

  // Get all users with push subscriptions
  const { data: subs, error: subErr } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth");

  if (subErr || !subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, error: subErr?.message });
  }

  // Group subscriptions by user
  const subsByUser = new Map<string, Array<{ endpoint: string; p256dh: string; auth: string }>>();
  for (const s of subs) {
    const arr = subsByUser.get(s.user_id) ?? [];
    arr.push({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth });
    subsByUser.set(s.user_id, arr);
  }

  const userIds = [...subsByUser.keys()];

  // Compute date range: Mon–Sun of this week (ET)
  const etNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const dayOfWeek = etNow.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(etNow);
  monday.setDate(etNow.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const monKey = monday.toISOString().slice(0, 10);
  const sunKey = sunday.toISOString().slice(0, 10);

  // Get routine items for all users
  const { data: routineItems } = await supabase
    .from("routine_items")
    .select("id, user_id, is_non_negotiable, is_active")
    .in("user_id", userIds)
    .eq("is_active", true);

  // Get daily_checks for the week
  const { data: checks } = await supabase
    .from("daily_checks")
    .select("user_id, date, routine_item_id, done")
    .in("user_id", userIds)
    .gte("date", monKey)
    .lte("date", sunKey);

  // Get daily_logs for the week (day_mode)
  const { data: logs } = await supabase
    .from("daily_logs")
    .select("user_id, date, day_mode")
    .in("user_id", userIds)
    .gte("date", monKey)
    .lte("date", sunKey);

  // Compute per-user stats
  let sent = 0;
  let failed = 0;

  for (const userId of userIds) {
    const userSubs = subsByUser.get(userId);
    if (!userSubs || userSubs.length === 0) continue;

    const userItems = (routineItems ?? []).filter(ri => ri.user_id === userId);
    const coreItemIds = new Set(userItems.filter(ri => ri.is_non_negotiable).map(ri => ri.id));
    const userChecks = (checks ?? []).filter(c => c.user_id === userId);
    const userLogs = (logs ?? []).filter(l => l.user_id === userId);

    // Count green/yellow/red days
    let green = 0, yellow = 0, red = 0;

    // Build dates Mon-Sun
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }

    for (const dk of dates) {
      const log = userLogs.find(l => l.date === dk);
      if (log?.day_mode === "travel" || log?.day_mode === "sick") {
        green++; // rest days count as green
        continue;
      }

      const dayChecks = userChecks.filter(c => c.date === dk);
      const coreDone = dayChecks.filter(c => coreItemIds.has(c.routine_item_id) && c.done).length;
      const coreMissed = coreItemIds.size - coreDone;

      if (coreItemIds.size === 0) continue; // no habits set up
      if (coreMissed === 0) green++;
      else if (coreMissed === 1) yellow++;
      else red++;
    }

    const totalTracked = green + yellow + red;
    if (totalTracked === 0) continue; // no activity this week

    // Build message
    const dots = "🟢".repeat(green) + "🟡".repeat(yellow) + "🔴".repeat(red);
    const pct = Math.round((green / Math.max(totalTracked, 1)) * 100);

    let headline: string;
    if (green === 7) headline = "Perfect week! 🏆";
    else if (green >= 5) headline = "Strong week! 💪";
    else if (green >= 3) headline = "Building momentum";
    else headline = "Room to grow 🌱";

    const body = `${dots}\n${green}/${totalTracked} green days (${pct}%)`;

    const payload = JSON.stringify({
      title: `📊 ${headline}`,
      body,
      tag: "weekly-summary",
      url: "/app/routines/progress",
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
          await supabase.from("push_subscriptions").delete()
            .eq("user_id", userId).eq("endpoint", sub.endpoint);
        }
      }
    }
  }

  return NextResponse.json({ sent, failed, users: userIds.length, week: `${monKey} to ${sunKey}` });
}
