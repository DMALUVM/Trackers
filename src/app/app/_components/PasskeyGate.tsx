"use client";

import { useEffect, useState } from "react";
import { isPasskeyEnabled, isUnlockValid, unlockWithPasskey } from "@/lib/passkey";

export function PasskeyGate({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const e = isPasskeyEnabled();
    setEnabled(e);
    setUnlocked(!e || isUnlockValid());
  }, []);

  const onUnlock = async () => {
    setStatus("Unlocking...");
    try {
      await unlockWithPasskey();
      setUnlocked(true);
      setStatus("");
    } catch (e: any) {
      setStatus(e?.message ?? String(e));
    }
  };

  if (!enabled || unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black text-white p-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-5">
        <h1 className="text-xl font-semibold tracking-tight">Unlock routines365</h1>
        <p className="mt-2 text-sm text-neutral-300">
          Use Face ID / Touch ID to unlock your routines.
        </p>

        <button
          type="button"
          className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"
          onClick={onUnlock}
        >
          Unlock with Face ID
        </button>

        {status ? <p className="mt-3 text-xs text-neutral-400">{status}</p> : null}
      </div>
    </div>
  );
}
