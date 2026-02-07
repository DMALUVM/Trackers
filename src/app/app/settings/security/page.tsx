"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { clearPasskey, getStoredCredentialId, isPasskeyEnabled, registerPasskey } from "@/lib/passkey";

export default function SecuritySettingsPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [credentialId, setCredentialId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      setSignedIn(!!data.session);
      setEmail(data.session?.user.email ?? null);
      setEnabled(isPasskeyEnabled());
      setCredentialId(getStoredCredentialId());
    };
    void run();
  }, []);

  const enablePasskey = async () => {
    if (!email) {
      setStatus("Please sign in again.");
      return;
    }
    setBusy(true);
    setStatus("Enabling Face ID...");
    try {
      const res = await registerPasskey({ email });
      setEnabled(true);
      setCredentialId(res.credentialId);
      setStatus("Enabled. Next time, the app can unlock with Face ID.");
      setTimeout(() => setStatus(""), 2000);
    } catch (e: any) {
      setStatus(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Security</h1>
        <p className="text-sm text-neutral-400">
          Use Face ID / Touch ID to <b>unlock the app</b> on this device.
        </p>
      </header>

      {!signedIn ? (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-neutral-300">Please sign in first.</p>
          <a
            className="mt-3 inline-block rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
            href="/"
          >
            Sign in
          </a>
        </section>
      ) : (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div>
            <h2 className="text-base font-semibold">Passkeys (Face ID)</h2>
            <p className="mt-1 text-sm text-neutral-400">
              After you enable this once, future unlocks should be one-tap with Face ID.
            </p>
            {enabled && credentialId ? (
              <p className="mt-2 text-xs text-neutral-500">Passkey saved on this device.</p>
            ) : null}
          </div>

          <button
            type="button"
            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-50"
            onClick={enablePasskey}
            disabled={busy || enabled}
          >
            {enabled ? "Face ID is enabled" : busy ? "Enabling..." : "Enable Face ID login"}
          </button>

          {enabled ? (
            <button
              type="button"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
              onClick={() => {
                clearPasskey();
                setEnabled(false);
                setCredentialId(null);
                setStatus("Face ID disabled.");
                setTimeout(() => setStatus(""), 1500);
              }}
              disabled={busy}
            >
              Disable Face ID
            </button>
          ) : null}

          {status ? <p className="text-xs text-neutral-400">{status}</p> : null}

          <p className="text-xs text-neutral-500">
            Note: passkeys will fall back to your device PIN if Face ID is unavailable.
          </p>
        </section>
      )}

      <a className="text-sm text-neutral-300 underline" href="/app/settings">
        Back
      </a>
    </div>
  );
}
