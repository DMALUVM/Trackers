"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Shield, X } from "lucide-react";
import { hapticHeavy, hapticMedium } from "@/lib/haptics";
import { usePremium } from "@/lib/premium";
import { canUseFreeze, useStreakFreeze } from "@/lib/streakFreeze";
import type { StreakData } from "@/lib/hooks/useStreaks";

const LS_DISMISSED = "routines365:streakInsurance:dismissed";

/**
 * Streak Insurance banner.
 * Shows after 8pm if user has an active streak but hasn't completed habits today.
 * Premium users can auto-freeze; free users get a nudge.
 */
export function StreakInsurance({
  streaks,
  allCoreDone,
  dateKey,
}: {
  streaks: StreakData;
  allCoreDone: boolean;
  dateKey: string;
}) {
  const { isPremium } = usePremium();
  const [show, setShow] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only show after 8pm
    const hour = new Date().getHours();
    if (hour < 20) return;

    // Don't show if already completed today
    if (allCoreDone) return;

    // Need an active streak worth protecting
    if (streaks.activeStreak < 2) return;

    // Check if already dismissed today
    try {
      const d = localStorage.getItem(LS_DISMISSED);
      if (d === dateKey) return;
    } catch {}

    setShow(true);
  }, [allCoreDone, streaks.activeStreak, dateKey]);

  if (!show || dismissed || frozen || allCoreDone) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(LS_DISMISSED, dateKey); } catch {}
  };

  const freeze = () => {
    hapticHeavy();
    const ok = useStreakFreeze(isPremium);
    if (ok) {
      setFrozen(true);
      try { localStorage.setItem(LS_DISMISSED, dateKey); } catch {}
    }
  };

  return (
    <div className="rounded-2xl p-4 relative animate-fade-in-up"
      style={{
        background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08))",
        border: "1px solid rgba(245,158,11,0.25)",
      }}>
      <button type="button" onClick={dismiss}
        className="absolute top-3 right-3 rounded-full p-1"
        style={{ background: "var(--bg-card-hover)" }}>
        <X size={12} style={{ color: "var(--text-faint)" }} />
      </button>

      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-xl p-2" style={{ background: "rgba(245,158,11,0.15)" }}>
          <Shield size={20} style={{ color: "#f59e0b" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            🔥 {streaks.activeStreak}-day streak at risk!
          </p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            You haven&apos;t completed your habits today. Complete them now or freeze your streak.
          </p>
          <div className="flex gap-2 mt-3">
            {isPremium && canUseFreeze(isPremium) && (
              <button type="button" onClick={freeze}
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: "#f59e0b", color: "white" }}>
                ❄️ Freeze Streak
              </button>
            )}
            {!isPremium && (
              <Link href="/app/settings/premium"
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: "#f59e0b", color: "white", textDecoration: "none" }}>
                🔒 Unlock Streak Freeze
              </Link>
            )}
            <button type="button" onClick={dismiss}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-primary)" }}>
              I&apos;ll finish tonight
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
