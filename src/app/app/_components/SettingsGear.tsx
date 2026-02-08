"use client";

import { usePathname, useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { hapticLight } from "@/lib/haptics";

export function SettingsGear() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide on settings pages and onboarding
  if (pathname?.startsWith("/app/settings") || pathname?.startsWith("/app/onboarding")) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => { hapticLight(); router.push("/app/settings"); }}
      className="fixed z-40 flex items-center justify-center rounded-full transition-colors active:scale-95"
      style={{
        top: "env(safe-area-inset-top, 12px)",
        right: 16,
        marginTop: 12,
        width: 36,
        height: 36,
        background: "var(--bg-card)",
        border: "1px solid var(--border-primary)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      }}
      aria-label="Settings">
      <Settings size={16} style={{ color: "var(--text-muted)" }} />
    </button>
  );
}
