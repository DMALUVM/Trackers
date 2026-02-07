"use client";

import { useEffect, useState } from "react";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showLabel?: boolean;
  subtitle?: string;
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
  const isComplete = clamped >= 100;

  const fillColor = color ?? (isComplete ? "var(--accent-green)" : clamped >= 50 ? "var(--accent-yellow)" : "var(--accent-red)");

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}>
      {/* Glow behind ring when complete */}
      {isComplete && (
        <div className="absolute inset-0 rounded-full animate-fade-in"
          style={{ background: "var(--accent-green-soft)", filter: "blur(8px)", transform: "scale(1.15)" }} />
      )}

      <svg width={size} height={size} className="-rotate-90 relative">
        {/* Background ring */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="var(--bg-card-hover)" strokeWidth={strokeWidth} />
        {/* Progress ring */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={fillColor} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? offset : circumference}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.3s" }} />
      </svg>

      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold tabular-nums animate-score-pop" key={clamped}
            style={{
              color: isComplete ? "var(--accent-green-text)" : "var(--text-primary)",
              fontSize: size >= 100 ? "1.5rem" : size >= 72 ? "1.25rem" : "1rem",
            }}>
            {isComplete && subtitle === "done!" ? "✓" : Math.round(clamped)}
          </span>
          {subtitle && !isComplete && (
            <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </span>
          )}
          {isComplete && subtitle && (
            <span className="text-[10px] font-bold" style={{ color: "var(--accent-green-text)" }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
