import { formatInTimeZone } from "date-fns-tz";

/**
 * App timezone — auto-detects from browser by default.
 * Users can override via localStorage("routines365:timezone").
 * Falls back to UTC during SSR (no window).
 */
function getTimezone(): string {
  if (typeof window === "undefined") return "UTC";
  try {
    const override = localStorage.getItem("routines365:timezone");
    if (override) return override;
  } catch { /* ignore */ }
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch { /* ignore */ }
  return "UTC";
}

export function getAppTimezone() {
  return getTimezone();
}

export function tzDateKey(d: Date) {
  return formatInTimeZone(d, getTimezone(), "yyyy-MM-dd");
}

// ISO day of week in the app timezone: 1=Mon..7=Sun
export function tzIsoDow(d: Date) {
  return Number(formatInTimeZone(d, getTimezone(), "i"));
}
