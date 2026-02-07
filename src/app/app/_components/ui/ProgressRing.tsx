"use client";

import { useEffect, useState } from "react";

interface ProgressRingProps {
  /** 0–100 */
  progress: number;
  /** Pixel size of the ring */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Color of the filled portion */
  color?: string;
  /** Show the percentage number in the center */
  showLabel?: boolean;
  /** Optional label below the number */
  subtitle?: string;
  /** Extra class on the wrapper */
  className?: string;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color,
  showLabel = true,
  subtitle,
  className = "",
}: ProgressRingProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  const offset = circumference - (clamped / 100) * circumference;

  // Determine color based on progress if not provided
  const fillColor =
    color ??
    (clamped >= 100
      ? "var(--accent-green)"
      : clamped >= 50
        ? "var(--accent-yellow)"
        : "var(--accent-red)");

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-card-hover)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? offset : circumference}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-2xl font-bold tabular-nums animate-score-pop"
            key={clamped}
            style={{ color: "var(--text-primary)" }}
          >
            {Math.round(clamped)}
          </span>
          {subtitle && (
            <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
