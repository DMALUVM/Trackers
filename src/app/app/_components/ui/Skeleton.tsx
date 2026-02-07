"use client";

export function SkeletonLine({ width = "100%", height = "14px" }: { width?: string; height?: string }) {
  return (
    <div
      className="animate-shimmer rounded-md"
      style={{ width, height }}
    />
  );
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
    <div className="card-interactive px-4 py-3 flex items-center gap-3">
      <div className="animate-shimmer h-5 w-5 rounded-full shrink-0" />
      <div className="animate-shimmer h-4 w-4 rounded shrink-0" />
      <SkeletonLine width="60%" />
      <div className="ml-auto">
        <SkeletonLine width="36px" />
      </div>
    </div>
  );
}

export function SkeletonProgressRing({ size = 120 }: { size?: number }) {
  return (
    <div
      className="animate-shimmer rounded-full"
      style={{ width: size, height: size }}
    />
  );
}

/** Full-page loading skeleton for the Today page */
export function TodayPageSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SkeletonLine width="80px" height="24px" />
        <SkeletonLine width="100px" height="32px" />
      </div>

      {/* Progress ring + score */}
      <div className="card p-6 flex flex-col items-center gap-3">
        <SkeletonProgressRing size={120} />
        <SkeletonLine width="120px" />
        <div className="flex gap-2 mt-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="animate-shimmer h-3 w-8 rounded-full" />
          ))}
        </div>
      </div>

      {/* Habit items */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonCheckItem key={i} />
        ))}
      </div>
    </div>
  );
}
