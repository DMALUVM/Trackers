import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
  addMonths,
} from "date-fns";

export function monthLabel(d: Date) {
  return format(d, "MMMM yyyy");
}

export function monthRange(d: Date) {
  const start = startOfMonth(d);
  const end = endOfMonth(d);
  return { start, end };
}

// Returns dates for a standard month grid (Mon–Sun weeks)
export function monthGridDates(month: Date) {
  const { start, end } = monthRange(month);
  const gridStart = startOfWeek(start, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(end, { weekStartsOn: 1 });

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);
  return days;
}

export function prevMonth(d: Date) {
  return subMonths(d, 1);
}

export function nextMonth(d: Date) {
  return addMonths(d, 1);
}
