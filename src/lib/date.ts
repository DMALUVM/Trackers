import { format } from "date-fns";

export function dateKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function monthKey(d: Date) {
  return format(d, "yyyy-MM");
}
