"use client";

import { useEffect, useState } from "react";
import { isPasskeyEnabled, isUnlockValid, unlockWithPasskey } from "@/lib/passkey";

export function PasskeyGate({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const e = isPasskeyEnabled();
    setEnabled(e);
    setUnlocked(!e || isUnlockValid());
  }, []);

  const onUnlock = async () => {
    setStatus("Unlocking...");
    try { await unlockWithPasskey(); setUnlocked(true); setStatus(""); }
    catch (e: unknown) { setStatus(e instanceof Error ? e.message : String(e)); }
  };

  if (!enabled || unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <div className="w-full max-w-sm card p-5">
        <h1 className="text-xl font-semibold tracking-tight">Unlock routines365</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          Use Face ID / Touch ID to unlock your routines.
        </p>
        <button type="button" className="btn-primary mt-4 w-full text-sm py-3" onClick={onUnlock}>
          Unlock with Face ID
        </button>
        {status && <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>{status}</p>}
      </div>
    </div>
  );
}
