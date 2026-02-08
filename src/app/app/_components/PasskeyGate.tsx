"use client";

import { useCallback, useEffect, useState } from "react";
import { isPasskeyEnabled, isUnlockValid, unlockWithPasskey, clearPasskey } from "@/lib/passkey";
import { BrandIcon } from "@/app/app/_components/BrandIcon";

/**
 * PasskeyGate — Face ID / Touch ID lock screen.
 *
 * IMPORTANT: This component renders OUTSIDE ThemeGate, so CSS variables
 * like var(--bg-primary) are NOT available. Use hardcoded colors only.
 *
 * Key design decisions:
 * - Initialize state synchronously from localStorage to avoid flash
 *   (children must never mount and then unmount — that causes AuthGate
 *   to start session loading, get torn down, then restart).
 * - Do NOT auto-prompt Face ID on mount. Show the lock screen and let
 *   the user tap "Unlock". Auto-prompting caused loops on Chrome/desktop
 *   where WebAuthn has no biometrics available.
 */
export function PasskeyGate({ children }: { children: React.ReactNode }) {
  // Synchronous init — no flash, no children mount/unmount cycle
  const [enabled] = useState(() => isPasskeyEnabled());
  const [unlocked, setUnlocked] = useState(() => !isPasskeyEnabled() || isUnlockValid());
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const handleUnlock = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setStatus("");
    try {
      await unlockWithPasskey();
      setUnlocked(true);
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [busy]);

  // Auto-prompt ONLY on mobile devices where Face ID / Touch ID is likely.
  // Skip on desktop (Chrome etc.) where WebAuthn prompts are disruptive.
  useEffect(() => {
    if (!enabled || unlocked) return;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      void handleUnlock();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!enabled || unlocked) return <>{children}</>;

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24,
      background: "#000", color: "#fff",
    }}>
      <div style={{ width: "100%", maxWidth: 384, textAlign: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <BrandIcon size={80} />
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", marginTop: 8 }}>
            Unlock Routines365
          </h1>
          <p style={{ fontSize: 14, color: "#9ca3af" }}>
            Use Face ID to access your routines.
          </p>
        </div>

        <button type="button"
          onClick={handleUnlock}
          disabled={busy}
          style={{
            marginTop: 24, width: "100%", padding: "14px 0",
            borderRadius: 12, border: "none", cursor: "pointer",
            background: "#10b981", color: "#000",
            fontSize: 14, fontWeight: 700,
            opacity: busy ? 0.6 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
          {busy ? "Verifying…" : "Unlock with Face ID"}
        </button>

        {status && (
          <div style={{
            marginTop: 16, borderRadius: 12, padding: "12px 16px",
            background: "rgba(239,68,68,0.1)", textAlign: "center",
          }}>
            <p style={{ fontSize: 12, color: "#fca5a5" }}>{status}</p>
            <button type="button"
              onClick={handleUnlock}
              style={{
                marginTop: 8, fontSize: 12, fontWeight: 600,
                color: "#fca5a5", background: "none", border: "none",
                cursor: "pointer", textDecoration: "underline",
              }}>
              Try again
            </button>
          </div>
        )}

        {/* Escape hatch — disable Face ID if stuck */}
        <button type="button"
          onClick={() => { clearPasskey(); setUnlocked(true); }}
          style={{
            marginTop: 24, fontSize: 12, color: "#6b7280",
            background: "none", border: "none", cursor: "pointer",
          }}>
          Disable Face ID and continue
        </button>
      </div>
    </div>
  );
}
