"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("");
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSignedInEmail(data.session?.user.email ?? null);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedInEmail(session?.user.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async () => {
    setStatus("Sending magic link...");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    if (error) {
      setStatus(`Error: ${error.message}`);
      return;
    }
    setStatus("Check your email for the sign-in link.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 bg-neutral-50 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Daily Routines</h1>
        <p className="text-sm text-neutral-600">
          Fast, mobile-first daily trackers.
        </p>
      </header>

      {signedInEmail ? (
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-neutral-700">
            Signed in as <span className="font-medium">{signedInEmail}</span>
          </p>
          <div className="mt-4 flex gap-3">
            <a
              className="flex-1 rounded-lg bg-black px-4 py-2 text-center text-sm font-medium text-white"
              href="/app/routines"
            >
              Open app
            </a>
            <button
              className="rounded-lg border px-4 py-2 text-sm font-medium"
              onClick={signOut}
            >
              Sign out
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-base font-medium">Sign in</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Use an email magic link (passkeys/Face ID next).
          </p>

          <label className="mt-4 block text-sm font-medium">Email</label>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
          />

          <button
            className="mt-4 w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={signInWithEmail}
            disabled={!email}
          >
            Send sign-in link
          </button>

          {status ? <p className="mt-3 text-sm text-neutral-700">{status}</p> : null}
        </section>
      )}

      <footer className="text-xs text-neutral-500">
        Tip: add this to your Home Screen for an app-like experience.
      </footer>
    </main>
  );
}
