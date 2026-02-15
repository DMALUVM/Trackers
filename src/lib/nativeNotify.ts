/**
 * Native local notifications via Capacitor bridge.
 * Falls back gracefully on web (uses existing web push system).
 */

function getPlugin(): Record<string, (...args: unknown[]) => Promise<unknown>> | null {
  if (typeof window === "undefined") return null;
  // @ts-expect-error - Capacitor global
  const cap = window.Capacitor;
  if (!cap) return null;
  try {
    return cap.Plugins?.LocalNotifyPlugin ?? cap.registerPlugin?.("LocalNotifyPlugin") ?? null;
  } catch {
    return null;
  }
}

/** Returns true if native local notifications are available */
export function isNativeNotifyAvailable(): boolean {
  return !!getPlugin();
}

/** Request notification permission. Returns true if granted. */
export async function requestNotifyPermission(): Promise<boolean> {
  const plugin = getPlugin();
  if (!plugin) return false;
  try {
    const result = await plugin.requestPermission() as { granted: boolean };
    return result.granted;
  } catch (e) {
    console.error("Notify permission error:", e);
    return false;
  }
}

/** Get current permission status: 'granted' | 'denied' | 'prompt' | 'unknown' */
export async function getNotifyPermissionStatus(): Promise<string> {
  const plugin = getPlugin();
  if (!plugin) return "unknown";
  try {
    const result = await plugin.getPermissionStatus() as { status: string };
    return result.status;
  } catch {
    return "unknown";
  }
}

/**
 * Schedule a daily repeating reminder.
 * @param id Unique ID for this reminder
 * @param title Notification title
 * @param body Notification body
 * @param hour Hour (0-23)
 * @param minute Minute (0-59)
 * @param weekdays ISO weekdays (1=Mon..7=Sun). Empty = every day.
 */
export async function scheduleDailyReminder(opts: {
  id: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
  weekdays?: number[];
}): Promise<boolean> {
  const plugin = getPlugin();
  if (!plugin) return false;
  try {
    await plugin.scheduleDailyReminder(opts as unknown);
    return true;
  } catch (e) {
    console.error("Schedule reminder error:", e);
    return false;
  }
}

/** Cancel a specific reminder by ID */
export async function cancelReminder(id: string): Promise<void> {
  const plugin = getPlugin();
  if (!plugin) return;
  try {
    await plugin.cancelReminder({ id } as unknown);
  } catch (e) {
    console.error("Cancel reminder error:", e);
  }
}

/** Cancel all pending notifications */
export async function cancelAllReminders(): Promise<void> {
  const plugin = getPlugin();
  if (!plugin) return;
  try {
    await plugin.cancelAll();
  } catch (e) {
    console.error("Cancel all error:", e);
  }
}

/** Clear the app icon badge and delivered notifications */
export async function clearBadge(): Promise<void> {
  const plugin = getPlugin();
  if (!plugin) return;
  try {
    await plugin.clearBadge();
  } catch {
    // Silently fail — badge clearing is best-effort
  }
}

/** List all pending (scheduled) notifications — useful for debugging */
export async function listPendingNotifications(): Promise<Array<{ id: string; title: string; body: string; hour: number; minute: number; weekday: number }>> {
  const plugin = getPlugin();
  if (!plugin) return [];
  try {
    const result = await plugin.listPending() as { notifications: Array<{ id: string; title: string; body: string; hour: number; minute: number; weekday: number }> };
    return result.notifications ?? [];
  } catch (e) {
    console.error("List pending error:", e);
    return [];
  }
}

/**
 * Schedule the main daily check-in reminder.
 * This is the key retention notification.
 */
export async function scheduleCheckInReminder(hour = 9, minute = 0): Promise<boolean> {
  const granted = await requestNotifyPermission();
  if (!granted) return false;

  return scheduleDailyReminder({
    id: "daily_checkin",
    title: "Time to check in ✅",
    body: "Open Routines365 and keep your streak going!",
    hour,
    minute,
  });
}

/**
 * Schedule a streak-at-risk evening reminder.
 * Fires if user hasn't completed their habits.
 */
export async function scheduleStreakReminder(hour = 20, minute = 0): Promise<boolean> {
  return scheduleDailyReminder({
    id: "streak_reminder",
    title: "Don't break your streak! 🔥",
    body: "You still have habits to check off today.",
    hour,
    minute,
  });
}

/**
 * Schedule a SMART streak-aware notification that includes the actual streak count.
 * Call this whenever the streak changes (after green day, on app open).
 * Replaces the generic streak reminder with a personalized one.
 *
 * Example: "Your 23-day streak ends at midnight! 🔥"
 */
export async function scheduleSmartStreakReminder(opts: {
  streakCount: number;
  hour?: number;
  minute?: number;
}): Promise<boolean> {
  const { streakCount, hour = 20, minute = 30 } = opts;

  // Don't bother for very short streaks
  if (streakCount < 2) {
    // Cancel any existing smart notification
    await cancelReminder("smart_streak");
    return false;
  }

  // Cancel the old generic one — the smart one replaces it
  await cancelReminder("streak_reminder");

  // Personalized message based on streak length
  let title: string;
  let body: string;

  if (streakCount >= 50) {
    title = `🔥 ${streakCount}-day streak at stake!`;
    body = `You've built something incredible. Don't lose it — check off your habits tonight.`;
  } else if (streakCount >= 21) {
    title = `🔥 ${streakCount}-day streak at risk!`;
    body = `Three weeks of consistency is rare. Protect it — open the app before midnight.`;
  } else if (streakCount >= 7) {
    title = `🔥 Your ${streakCount}-day streak ends at midnight!`;
    body = `You still have habits to complete. A few taps is all it takes.`;
  } else {
    title = `Don't break your ${streakCount}-day streak! 🔥`;
    body = `You're building momentum. Check off your habits before bed.`;
  }

  return scheduleDailyReminder({
    id: "smart_streak",
    title,
    body,
    hour,
    minute,
  });
}
