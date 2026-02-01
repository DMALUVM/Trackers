"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SecuritySettingsPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      setSignedIn(!!data.session);
    };
    void run();
  }, []);

  const enablePasskey = async () => {
    // Placeholder: next commit wires real passkey / WebAuthn.
    setStatus("Passkeys (Face ID) are being wired up next. Stand by.");
    setTimeout(() => setStatus(""), 2500);
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Security</h1>
        <p className="text-sm text-neutral-400">
          Enable passkeys so sign-in uses Face ID / Touch ID.
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
              After you enable this once, future sign-ins can be one-tap with Face ID.
            </p>
          </div>

          <button
            type="button"
            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"
            onClick={enablePasskey}
          >
            Enable Face ID login
          </button>

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
