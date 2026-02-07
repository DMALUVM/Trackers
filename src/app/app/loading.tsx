export default function Loading() {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-xl animate-pulse" style={{ background: "var(--bg-card-hover)" }} />
        <div className="h-4 w-32 rounded-lg animate-pulse" style={{ background: "var(--bg-card)" }} />
      </div>
      {/* Card skeleton */}
      <div className="rounded-2xl p-5 space-y-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full animate-pulse" style={{ background: "var(--bg-card-hover)" }} />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 rounded-lg animate-pulse" style={{ background: "var(--bg-card-hover)" }} />
            <div className="h-3 w-36 rounded animate-pulse" style={{ background: "var(--bg-card-hover)" }} />
          </div>
        </div>
      </div>
      {/* Check items skeleton */}
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 rounded-2xl animate-pulse"
            style={{ background: "var(--bg-card)", animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    </div>
  );
}
