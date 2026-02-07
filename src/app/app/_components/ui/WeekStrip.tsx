"use client";

import type { DayColor } from "@/lib/progress";

interface WeekStripProps {
  days: Array<{ dateKey: string; color: DayColor }>;
  className?: string;
}

const DOW_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function dotClass(color: DayColor) {
  switch (color) {
    case "green": return "day-green";
    case "yellow": return "day-yellow";
    case "red": return "day-red";
    default: return "day-empty";
  }
}

export function WeekStrip({ days, className = "" }: WeekStripProps) {
  if (days.length === 0) {
    return (
      <p className="text-xs" style={{ color: "var(--text-faint)" }}>
        Building your history…
      </p>
    );
  }

  // Figure out what day-of-week the first entry is so we can label correctly
  const firstDate = new Date(days[0].dateKey + "T12:00:00");
  const firstDow = (firstDate.getDay() + 6) % 7; // Convert Sun=0 to Mon=0

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {days.map((d, i) => {
        const dowIdx = (firstDow + i) % 7;
        return (
          <div key={d.dateKey} className="flex flex-col items-center gap-1.5">
            <div className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>
              {DOW_LABELS[dowIdx]}
            </div>
            <div
              className={`h-3 w-8 rounded-full transition-colors duration-300 ${dotClass(d.color)}`}
            />
            <div className="text-[10px] tabular-nums" style={{ color: "var(--text-faint)" }}>
              {d.dateKey.slice(8)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
