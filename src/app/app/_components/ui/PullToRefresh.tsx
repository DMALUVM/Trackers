"use client";

/**
 * Visual indicator for pull-to-refresh.
 * Shows a spinning arrow that animates as you pull down,
 * then spins continuously during refresh.
 */
export function PullToRefreshIndicator({
  pulling,
  refreshing,
  pullDistance,
  progress,
  pastThreshold,
}: {
  pulling: boolean;
  refreshing: boolean;
  pullDistance: number;
  progress: number;
  pastThreshold: boolean;
}) {
  if (!pulling && !refreshing) return null;

  return (
    <div
      className="flex justify-center overflow-hidden transition-all duration-150"
      style={{
        height: pullDistance > 0 ? pullDistance * 0.5 : refreshing ? 40 : 0,
        opacity: progress > 0.15 ? 1 : 0,
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 28,
          height: 28,
          transition: refreshing ? "none" : "transform 0.1s ease-out",
          transform: refreshing
            ? undefined
            : `rotate(${progress * 270}deg) scale(${0.6 + progress * 0.4})`,
          animation: refreshing ? "spin 0.8s linear infinite" : undefined,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ stroke: pastThreshold || refreshing ? "var(--accent-green)" : "var(--text-muted)" }}>
          <path d="M21 12a9 9 0 1 1-6.2-8.6" />
          <path d="M21 3v5h-5" />
        </svg>
      </div>
    </div>
  );
}
