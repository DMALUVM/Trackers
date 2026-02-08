"use client";

import type { DayColor } from "@/lib/progress";

interface WeekStripProps {
  days: Array<{ dateKey: string; color: DayColor }>;
  className?: string;
}

const DOW_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function dotStyle(color: DayColor, isToday: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 700,
    transition: "background 0.3s, transform 0.3s, box-shadow 0.3s",
    transform: isToday ? "scale(1.1)" : "scale(1)",
  };

  switch (color) {
    case "green":
      return { ...base, background: "var(--accent-green)", color: "var(--text-inverse)", boxShadow: isToday ? "0 0 0 3px var(--accent-green-soft)" : undefined };
    case "yellow":
      return { ...base, background: "var(--accent-yellow)", color: "var(--text-inverse)" };
    case "red":
      return { ...base, background: "var(--accent-red)", color: "var(--text-inverse)" };
    default:
      return { ...base, background: "var(--bg-card-hover)", color: "var(--text-faint)" };
  }
}

export function WeekStrip({ days, className = "" }: WeekStripProps) {
  if (days.length === 0) {
    return <p className="text-xs" style={{ color: "var(--text-faint)" }}>Building your history…</p>;
  }

  const firstDate = new Date(days[0].dateKey + "T12:00:00");
  const firstDow = (firstDate.getDay() + 6) % 7;
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className={`flex items-center justify-between w-full max-w-xs ${className}`}>
      {days.map((d, i) => {
        const dowIdx = (firstDow + i) % 7;
        const isToday = d.dateKey === todayKey;
        const dayNum = d.dateKey.slice(8);
        return (
          <div key={d.dateKey} className="flex flex-col items-center gap-1">
            <div className="text-[10px] font-semibold" style={{ color: isToday ? "var(--text-primary)" : "var(--text-faint)" }}>
              {DOW_LABELS[dowIdx]}
            </div>
            <div style={dotStyle(d.color, isToday)}>
              {dayNum.replace(/^0/, "")}
            </div>
          </div>
        );
      })}
    </div>
  );
}
