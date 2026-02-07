import Link from "next/link";

export default function AppNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center space-y-4 max-w-xs">
        <div className="text-4xl">🔍</div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Not found</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          This page doesn't exist or was moved.
        </p>
        <Link href="/app/today"
          className="inline-block rounded-xl px-5 py-2.5 text-sm font-bold"
          style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>
          Back to Today
        </Link>
      </div>
    </div>
  );
}
