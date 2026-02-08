"use client";

import Link from "next/link";
import { Lock, Crown } from "lucide-react";
import { hapticLight } from "@/lib/haptics";

/** Small inline lock badge that links to premium page */
export function ProBadge() {
  return (
    <Link href="/app/settings/premium" onClick={() => hapticLight()}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide tap-btn"
      style={{
        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))",
        color: "var(--accent-green-text)",
        border: "1px solid rgba(16, 185, 129, 0.2)",
      }}>
      <Crown size={10} />
      PRO
    </Link>
  );
}

/** Larger upsell card for gating premium content sections */
export function PremiumGate({ feature, compact }: { feature: string; compact?: boolean }) {
  if (compact) {
    return (
      <Link href="/app/settings/premium" onClick={() => hapticLight()}
        className="flex items-center gap-2 py-2.5 px-3.5 rounded-xl tap-btn"
        style={{
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.02))",
          border: "1px solid rgba(16, 185, 129, 0.15)",
        }}>
        <Lock size={14} style={{ color: "var(--accent-green-text)" }} />
        <span className="text-xs font-semibold" style={{ color: "var(--accent-green-text)" }}>
          Unlock {feature} with Pro
        </span>
      </Link>
    );
  }

  return (
    <Link href="/app/settings/premium" onClick={() => hapticLight()}
      className="card flex flex-col items-center text-center p-5 gap-3 tap-btn"
      style={{
        background: "linear-gradient(180deg, var(--bg-card), rgba(16, 185, 129, 0.03))",
        border: "1px solid rgba(16, 185, 129, 0.15)",
      }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: "var(--accent-green-soft)" }}>
        <Lock size={20} style={{ color: "var(--accent-green-text)" }} />
      </div>
      <div>
        <p className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          Unlock {feature}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Available with Routines365 Pro
        </p>
      </div>
      <span className="text-xs font-bold px-4 py-2 rounded-full"
        style={{ background: "var(--accent-green)", color: "white" }}>
        Learn More
      </span>
    </Link>
  );
}
