"use client";

import { useMemo } from "react";
import type { DayColor } from "@/lib/progress";

/**
 * GitHub-style year heatmap showing green day consistency.
 * Renders 52 columns (weeks) × 7 rows (days), newest on the right.
 * Each cell is 10px with 2px gap — compact enough to fit a phone screen.
 */
export function YearHeatmap({
  dayColors,
  todayKey,
}: {
  /** Map of dateKey → DayColor for the past ~365 days */
  dayColors: Map<string, DayColor>;
  todayKey: string;
}) {
  // Build a 52×7 grid of cells, right-aligned to today
  const cells = useMemo(() => {
    const today = new Date(todayKey + "T12:00:00");
    const todayDow = today.getDay(); // 0=Sun
    const result: Array<{ dateKey: string; color: DayColor; future: boolean }> = [];

    // Total cells = 52 weeks × 7 days + remaining days to fill current week
    // We go back 52 full weeks from the start of the current week
    const totalDays = 52 * 7 + todayDow + 1; // +1 to include today

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dk = `${y}-${m}-${day}`;
      const isFuture = dk > todayKey;
      const color = isFuture ? "empty" : (dayColors.get(dk) ?? "empty");
      result.push({ dateKey: dk, color, future: isFuture });
    }

    return result;
  }, [dayColors, todayKey]);

  // Organize into columns (weeks). Each column is 7 cells (Sun=0 → Sat=6)
  const columns = useMemo(() => {
    const cols: Array<typeof cells> = [];
    for (let i = 0; i < cells.length; i += 7) {
      cols.push(cells.slice(i, i + 7));
    }
    return cols;
  }, [cells]);

  // Count stats
  const stats = useMemo(() => {
    let green = 0, yellow = 0, red = 0, total = 0;
    for (const c of cells) {
      if (c.future || c.color === "empty") continue;
      total++;
      if (c.color === "green") green++;
      else if (c.color === "yellow") yellow++;
      else if (c.color === "red") red++;
    }
    return { green, yellow, red, total, pct: total > 0 ? Math.round((green / total) * 100) : 0 };
  }, [cells]);

  const colorMap: Record<DayColor, string> = {
    green: "var(--accent-green)",
    yellow: "var(--accent-yellow)",
    red: "var(--accent-red)",
    empty: "var(--bg-card-hover)",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
          Year View
        </p>
        <p className="text-xs font-semibold tabular-nums" style={{ color: "var(--accent-green-text)" }}>
          {stats.green} green days ({stats.pct}%)
        </p>
      </div>

      {/* Heatmap grid */}
      <div className="card p-3 overflow-x-auto">
        <div className="flex gap-[2px]" style={{ minWidth: "fit-content" }}>
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[2px]">
              {col.map((cell) => (
                <div
                  key={cell.dateKey}
                  title={`${cell.dateKey}: ${cell.color}`}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: cell.future
                      ? "transparent"
                      : colorMap[cell.color],
                    opacity: cell.future ? 0 : cell.color === "empty" ? 0.4 : 1,
                    transition: "background 0.15s",
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Month labels along the bottom */}
        <div className="flex mt-1.5" style={{ minWidth: "fit-content" }}>
          {(() => {
            // Place month labels at the right column positions
            const labels: Array<{ label: string; col: number }> = [];
            let lastMonth = "";
            columns.forEach((col, ci) => {
              if (col.length === 0) return;
              // Use the first cell of the column
              const dk = col[0].dateKey;
              const month = dk.slice(0, 7); // YYYY-MM
              if (month !== lastMonth) {
                const d = new Date(dk + "T12:00:00");
                const name = d.toLocaleString("default", { month: "short" });
                labels.push({ label: name, col: ci });
                lastMonth = month;
              }
            });

            return labels.map(({ label, col }, i) => {
              const nextCol = labels[i + 1]?.col ?? columns.length;
              const span = nextCol - col;
              return (
                <div
                  key={`${label}-${col}`}
                  style={{
                    width: span * 12, // 10px cell + 2px gap
                    flexShrink: 0,
                  }}
                >
                  <span className="text-[9px] font-medium" style={{ color: "var(--text-faint)" }}>
                    {label}
                  </span>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Compact legend */}
      <div className="flex items-center justify-center gap-3 mt-2">
        <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>Less</span>
        {(["empty", "red", "yellow", "green"] as DayColor[]).map((c) => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: 2, background: colorMap[c], opacity: c === "empty" ? 0.4 : 1 }} />
        ))}
        <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>More</span>
      </div>
    </div>
  );
}
