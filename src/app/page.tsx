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
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Daily Routines</h1>
        <p className="text-sm text-neutral-600">
          Mobile-first tracker. Auth is powered by Supabase.
        </p>
      </header>

      {signedInEmail ? (
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-neutral-700">
            Signed in as <span className="font-medium">{signedInEmail}</span>
          </p>
          <div className="mt-4 flex gap-3">
            <button
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
              onClick={signOut}
            >
              Sign out
            </button>
          </div>

          <div className="mt-6 space-y-2 text-sm text-neutral-700">
            <p className="font-medium">Next up (we’ll build this out):</p>
            <ul className="list-disc pl-5">
              <li>Routine module</li>
              <li>Rowing module</li>
              <li>Neurofeedback module</li>
              <li>Passkeys (Face ID) after basic auth is solid</li>
            </ul>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-base font-medium">Sign in</h2>
          <p className="mt-1 text-sm text-neutral-600">
            For now, use an email magic link. We can add passkeys after.
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
        Setup required: add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
        in Vercel env vars.
      </footer>
    </main>
  );
}
