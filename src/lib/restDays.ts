const LS_KEY = "routines365:restDays";

export function getRestDays(): number[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function setRestDays(days: number[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(days));
}

/**
 * Check if a given date is a scheduled rest day.
 * Uses ISO day-of-week: 1=Mon ... 7=Sun
 */
export function isRestDay(dateKey: string): boolean {
  const d = new Date(dateKey + "T12:00:00");
  const dow = d.getDay(); // 0=Sun
  const iso = dow === 0 ? 7 : dow;
  return getRestDays().includes(iso);
}
