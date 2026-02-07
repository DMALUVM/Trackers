export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-40 rounded-lg" style={{ background: "var(--bg-card-hover)" }} />
      <div className="h-3 w-56 rounded" style={{ background: "var(--bg-card)" }} />
      <div className="mt-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-2xl" style={{ background: "var(--bg-card)" }} />
        ))}
      </div>
    </div>
  );
}
