import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="text-center space-y-4 max-w-xs">
        <div className="text-5xl">🧭</div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
          Page not found
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          This page doesn't exist. Let's get you back on track.
        </p>
        <Link href="/app/today"
          className="inline-block rounded-xl px-6 py-3 text-sm font-bold transition-transform active:scale-[0.97]"
          style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>
          Go to Today →
        </Link>
      </div>
    </div>
  );
}
