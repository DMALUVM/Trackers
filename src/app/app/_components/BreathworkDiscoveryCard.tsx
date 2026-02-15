"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wind, X } from "lucide-react";
import { hapticLight } from "@/lib/haptics";

const LS_KEY = "routines365:breathworkDiscovery";
const MAX_AGE_DAYS = 7; // Only show during first week

/**
 * Discovery card that appears on the Today page during a user's first week.
 * Encourages them to try a 2-minute breathwork session — the most unique
 * feature in the app and the one most likely to create an "aha" moment.
 *
 * Dismisses permanently after tapping through or closing.
 */
export function BreathworkDiscoveryCard({ accountCreatedAt }: { accountCreatedAt?: string | null }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Already dismissed?
    try {
      if (localStorage.getItem(LS_KEY) === "dismissed") return;
    } catch {}

    // Already did a breathwork session? No need to prompt.
    try {
      const keys = Object.keys(localStorage);
      const hasSession = keys.some(
        (k) => k.startsWith("routines365:sessions:") && localStorage.getItem(k)?.includes('"breathwork"')
      );
      if (hasSession) {
        try { localStorage.setItem(LS_KEY, "dismissed"); } catch {}
        return;
      }
    } catch {}

    // Only show in first 7 days
    if (accountCreatedAt) {
      const created = new Date(accountCreatedAt);
      const now = new Date();
      const daysSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation > MAX_AGE_DAYS) {
        try { localStorage.setItem(LS_KEY, "dismissed"); } catch {}
        return;
      }
    }

    setShow(true);
  }, [accountCreatedAt]);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem(LS_KEY, "dismissed"); } catch {}
  };

  return (
    <div className="rounded-2xl p-4 relative animate-fade-in-up"
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))",
        border: "1px solid rgba(99,102,241,0.2)",
      }}>
      <button type="button" onClick={dismiss}
        className="absolute top-3 right-3 rounded-full p-1"
        style={{ background: "var(--bg-card-hover)" }}>
        <X size={12} style={{ color: "var(--text-faint)" }} />
      </button>

      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-xl p-2.5" style={{ background: "rgba(99,102,241,0.15)" }}>
          <Wind size={22} style={{ color: "#6366f1" }} />
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Try a 2-minute breathing session
          </p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Guided breathwork with binaural audio. Most people feel calmer after their first session.
          </p>
          <Link href="/app/breathwork" onClick={() => { hapticLight(); dismiss(); }}
            className="inline-flex items-center gap-1.5 mt-2.5 px-3.5 py-1.5 rounded-lg text-xs font-bold"
            style={{
              background: "#6366f1",
              color: "white",
              textDecoration: "none",
            }}>
            <Wind size={13} /> Start breathing
          </Link>
        </div>
      </div>
    </div>
  );
}
