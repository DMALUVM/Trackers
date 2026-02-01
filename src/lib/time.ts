import { formatInTimeZone } from "date-fns-tz";

export const APP_TIMEZONE = "America/New_York";

export function tzDateKey(d: Date) {
  return formatInTimeZone(d, APP_TIMEZONE, "yyyy-MM-dd");
}

// ISO day of week in the app timezone: 1=Mon..7=Sun
export function tzIsoDow(d: Date) {
  // date-fns-tz: 'i' is ISO day of week
  return Number(formatInTimeZone(d, APP_TIMEZONE, "i"));
}
