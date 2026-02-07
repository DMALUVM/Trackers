"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { hapticLight } from "@/lib/haptics";

/**
 * Consistent header for all sub-pages with back navigation.
 * Every screen deeper than the main tabs should use this.
 * 
 * Psychology: Consistent navigation patterns reduce cognitive load.
 * Users shouldn't have to think about how to go back.
 */
export function SubPageHeader({
  title,
  subtitle,
  backHref,
  rightAction,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  rightAction?: React.ReactNode;
}) {
  const router = useRouter();

  const goBack = () => {
    hapticLight();
    if (backHref) router.push(backHref);
    else router.back();
  };

  return (
    <header className="flex items-center gap-3 pt-1">
      <button type="button" onClick={goBack}
        className="shrink-0 flex items-center justify-center rounded-full transition-colors active:scale-95"
        style={{ width: 36, height: 36, background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}
        aria-label="Go back">
        <ChevronLeft size={18} style={{ color: "var(--text-muted)" }} />
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold tracking-tight truncate" style={{ color: "var(--text-primary)" }}>{title}</h1>
        {subtitle && <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
      </div>
      {rightAction && <div className="shrink-0">{rightAction}</div>}
    </header>
  );
}
