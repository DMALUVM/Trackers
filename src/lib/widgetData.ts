/**
 * Push habit progress data to the iOS home screen widget.
 * The widget reads from a shared App Group container.
 */

function getPlugin(): Record<string, (...args: unknown[]) => Promise<unknown>> | null {
  if (typeof window === "undefined") return null;
  // @ts-expect-error - Capacitor global
  const cap = window.Capacitor;
  if (!cap) return null;
  try {
    return cap.Plugins?.WidgetDataPlugin ?? null;
  } catch {
    return null;
  }
}

/** Returns true if widget data bridge is available (native app) */
export function isWidgetAvailable(): boolean {
  return !!getPlugin();
}

/**
 * Update the widget with current habit progress.
 * Call this whenever habits are toggled or the day changes.
 */
export async function updateWidgetData(data: {
  streak: number;
  bestStreak: number;
  todayDone: number;
  todayTotal: number;
  greenToday: boolean;
}): Promise<void> {
  const plugin = getPlugin();
  if (!plugin) return;
  try {
    await plugin.updateWidgetData(data as unknown);
  } catch (e) {
    console.error("Widget data update error:", e);
  }
}

/** Force widget to reload its timeline */
export async function reloadWidget(): Promise<void> {
  const plugin = getPlugin();
  if (!plugin) return;
  try {
    await plugin.reloadWidget();
  } catch (e) {
    console.error("Widget reload error:", e);
  }
}
