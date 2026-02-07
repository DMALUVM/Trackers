"use client";

import { useEffect, useState } from "react";
import { isPasskeyEnabled, isUnlockValid, unlockWithPasskey } from "@/lib/passkey";
import { BrandIcon } from "@/app/app/_components/BrandIcon";

export function PasskeyGate({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const e = isPasskeyEnabled();
    setEnabled(e);
    setUnlocked(!e || isUnlockValid());
    // Auto-prompt on mount if enabled
    if (e && !isUnlockValid()) {
      void handleUnlock();
    }
  }, []); // eslint-disable-line

  const handleUnlock = async () => {
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
  };

  if (!enabled || unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="space-y-3">
          <div className="mx-auto" style={{ width: 80 }}>
            <BrandIcon size={80} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Unlock Routines365</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Use Face ID to access your routines.
          </p>
        </div>

        <button type="button"
          className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2"
          onClick={handleUnlock}
          disabled={busy}>
          {busy ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-current/20 border-t-current animate-spin" />
              Verifying…
            </>
          ) : "Unlock with Face ID"}
        </button>

        {status && (
          <div className="rounded-xl px-4 py-3" style={{ background: "var(--accent-red-soft)" }}>
            <p className="text-xs" style={{ color: "var(--accent-red-text)" }}>{status}</p>
            <button type="button" className="mt-2 text-xs font-semibold underline"
              style={{ color: "var(--accent-red-text)" }}
              onClick={handleUnlock}>
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
