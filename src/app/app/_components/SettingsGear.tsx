"use client";

import { usePathname, useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { hapticLight } from "@/lib/haptics";

export function SettingsGear() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide on settings pages, onboarding, today, and full-screen feature pages
  if (
    pathname?.startsWith("/app/settings") ||
    pathname?.startsWith("/app/onboarding") ||
    pathname === "/app/today" ||
    pathname === "/app/breathwork" ||
    pathname === "/app/movement" ||
    pathname === "/app/focus" ||
    pathname === "/app/streaks" ||
    pathname === "/app/partner" ||
    pathname === "/app/race" ||
    pathname === "/app/wod"
  ) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => { hapticLight(); router.push("/app/settings"); }}
      className="tap-btn fixed z-40 flex items-center justify-center rounded-full"
      style={{
        top: "calc(env(safe-area-inset-top, 52px) + 12px)",
        right: 16,
        width: 40,
        height: 40,
        background: "var(--bg-card)",
        border: "1px solid var(--border-primary)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      }}
      aria-label="Settings">
      <Settings size={18} style={{ color: "var(--text-muted)" }} />
    </button>
  );
}
