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
          typeof window !== "undefined"
            ? `${window.location.origin}/app/routines`
            : undefined,
      },
    });
    if (error) {
      setStatus(`Error: ${error.message}`);
      return;
    }
    setStatus("Check your email for the sign-in link.");
  };

  const signOut = async () => {
    setStatus("Signing out...");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setStatus("");
    } catch (e: any) {
      setStatus(`Sign out failed: ${e?.message ?? String(e)}`);
    }
  };

  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="mx-auto w-full max-w-md px-6 py-10">
        <header className="space-y-5">
          <div className="flex items-center justify-center">
            <img
              src="/brand/routines365-logo.jpg"
              alt="routines365"
              className="h-28 w-28 rounded-3xl border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
            />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">routines365</h1>
            <p className="text-sm text-neutral-300">
              A daily system you can actually stick with.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs text-neutral-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              Fast
              <div className="mt-1 text-[11px] text-neutral-500">1-tap logging</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              Simple
              <div className="mt-1 text-[11px] text-neutral-500">Core habits</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              Motivating
              <div className="mt-1 text-[11px] text-neutral-500">Visible progress</div>
            </div>
          </div>
        </header>

        <div className="mt-8 space-y-4">
          {signedInEmail ? (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-neutral-200">
                Signed in as <span className="font-semibold">{signedInEmail}</span>
              </p>
              <div className="mt-4 flex gap-2">
                <a
                  className="flex-1 rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-black"
                  href="/app/routines"
                >
                  Open app
                </a>
                <button
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                  onClick={signOut}
                  type="button"
                >
                  Sign out
                </button>
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-base font-semibold">Sign in / Sign up</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Enter your email. We’ll send a magic link. After that, you stay signed in.
              </p>

              <label className="mt-4 block text-xs font-medium text-neutral-300">Email</label>
              <input
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-base text-white placeholder:text-neutral-500"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                inputMode="email"
              />

              <button
                className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-50"
                onClick={signInWithEmail}
                disabled={!email}
              >
                Send magic link
              </button>

              {status ? <p className="mt-3 text-xs text-neutral-400">{status}</p> : null}
            </section>
          )}

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold">See it</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href="/app/routines"
                className="rounded-2xl border border-white/10 bg-black/20 p-2 hover:bg-white/5"
              >
                <img
                  src="/brand/screenshots/routines.png"
                  alt="Routines screen"
                  className="w-full rounded-xl"
                />
                <p className="mt-2 text-xs text-neutral-400">Routines</p>
              </a>
              <a
                href="/app/routines/progress"
                className="rounded-2xl border border-white/10 bg-black/20 p-2 hover:bg-white/5"
              >
                <img
                  src="/brand/screenshots/progress.png"
                  alt="Progress screen"
                  className="w-full rounded-xl"
                />
                <p className="mt-2 text-xs text-neutral-400">Progress</p>
              </a>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold">Built for real life</h3>
            <ul className="mt-3 space-y-2 text-sm text-neutral-300">
              <li>• Core habits vs optional habits (so you always know what matters).</li>
              <li>• Track workouts and cardio with weekly/monthly totals.</li>
              <li>• Export your data anytime (you own your progress).</li>
            </ul>
          </section>
        </div>

        <footer className="mt-8 flex items-center justify-between text-xs text-neutral-500">
          <span>Tip: add to Home Screen for a real app feel (iOS Safari).</span>
          <span className="space-x-3">
            <a className="hover:text-neutral-300" href="/privacy">
              Privacy
            </a>
            <a className="hover:text-neutral-300" href="/terms">
              Terms
            </a>
          </span>
        </footer>
      </div>
    </main>
  );
}
