"use client";

import { useMemo, useState } from "react";
import { getDailyQuote } from "@/lib/dailyQuotes";
import { hapticLight } from "@/lib/haptics";

const LS_KEY = "routines365:dailyWisdom:hidden";

/**
 * Daily stoic wisdom card.
 * Shows one quote per day — same quote for all users.
 * Subtle, inspirational, not preachy.
 */
export function DailyWisdom() {
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === "1"; } catch { return false; }
  });

  const quote = useMemo(() => getDailyQuote(), []);

  if (hidden) return null;

  return (
    <div className="rounded-2xl p-4"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
      <div className="flex items-start gap-3">
        <span className="text-lg shrink-0 mt-0.5">🏛️</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed italic"
            style={{ color: "var(--text-secondary)" }}>
            &ldquo;{quote.text}&rdquo;
          </p>
          <p className="text-xs mt-2 font-semibold" style={{ color: "var(--text-faint)" }}>
            — {quote.author}{quote.source ? `, ${quote.source}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
