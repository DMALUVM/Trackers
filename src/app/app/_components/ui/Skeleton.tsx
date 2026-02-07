"use client";

export function SkeletonLine({ width = "100%", height = "14px" }: { width?: string; height?: string }) {
  return <div className="animate-shimmer rounded-md" style={{ width, height }} />;
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card p-4 space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === 0 ? "40%" : i === lines - 1 ? "60%" : "100%"} />
      ))}
    </div>
  );
}

export function SkeletonCheckItem() {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
      <div className="animate-shimmer h-7 w-7 rounded-full shrink-0" />
      <div className="animate-shimmer h-4 w-4 rounded shrink-0" />
      <SkeletonLine width="55%" height="16px" />
    </div>
  );
}

export function SkeletonProgressRing({ size = 88 }: { size?: number }) {
  return <div className="animate-shimmer rounded-full" style={{ width: size, height: size }} />;
}

/** Full-page skeleton for the Today page */
export function TodayPageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Header */}
      <div>
        <SkeletonLine width="120px" height="16px" />
        <div className="mt-1.5">
          <SkeletonLine width="180px" height="28px" />
        </div>
      </div>

      {/* Score card */}
      <div className="card p-5">
        <div className="flex items-center gap-5">
          <SkeletonProgressRing />
          <div className="flex-1 space-y-2">
            <SkeletonLine width="140px" height="18px" />
            <SkeletonLine width="80px" height="14px" />
            <SkeletonLine width="100px" height="14px" />
          </div>
        </div>
        <div className="flex justify-center gap-3 mt-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="animate-shimmer h-8 w-8 rounded-full" />
          ))}
        </div>
      </div>

      {/* Core label */}
      <SkeletonLine width="40px" height="12px" />

      {/* Habit items */}
      <div className="space-y-2.5">
        {[1, 2, 3, 4, 5].map((i) => <SkeletonCheckItem key={i} />)}
      </div>
    </div>
  );
}
