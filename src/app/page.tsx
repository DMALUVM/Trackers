"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [status, setStatus] = useState<string>("");
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

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

  useEffect(() => {
    // If we just arrived via magic link and session is now established, push into the app.
    if (signedInEmail) {
      let target = "/app/today";
      if (typeof window !== "undefined") {
        const next = new URLSearchParams(window.location.search).get("next");
        if (next && next.startsWith("/")) target = next;
      }
      const t = setTimeout(() => {
        router.replace(target);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [signedInEmail, router]);

  const getSiteUrl = () =>
    (process.env.NEXT_PUBLIC_SITE_URL &&
      process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")) ||
    (typeof window !== "undefined" ? window.location.origin : "");

  const signInWithMagicLink = async () => {
    setStatus("Sending magic link...");
    const siteUrl = getSiteUrl();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Important: iOS PWAs can fail to persist sessions if the magic link lands directly on an app route.
        // Landing on / lets Supabase establish the session cleanly, then we redirect into the app.
        emailRedirectTo: siteUrl ? `${siteUrl}/` : undefined,
      },
    });
    if (error) {
      setStatus(`Error: ${error.message}`);
      return;
    }
    setStatus("Check your email for the sign-in link.");
  };

  const signInWithPassword = async () => {
    setStatus("Signing in...");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setStatus(`Error: ${error.message}`);
      return;
    }
    setStatus("");
  };

  const createAccountWithPassword = async () => {
    setStatus("Creating account...");
    const siteUrl = getSiteUrl();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: siteUrl ? `${siteUrl}/` : undefined,
      },
    });
    if (error) {
      setStatus(`Error: ${error.message}`);
      return;
    }
    setStatus(
      "Account created. If email confirmation is required, check your inbox. Otherwise you should be signed in."
    );
  };

  const resetPassword = async () => {
    setStatus("Sending password reset email...");
    const siteUrl = getSiteUrl();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: siteUrl ? `${siteUrl}/reset` : undefined,
    });
    if (error) {
      setStatus(`Error: ${error.message}`);
      return;
    }
    setStatus("Check your email for the password reset link.");
  };

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setStatus("Signing out...");
    try {
      const { error } = await supabase.auth.signOut();
      // Supabase can return a benign error if the session is already gone.
      if (error && !String(error.message).toLowerCase().includes("session")) throw error;
      // Ensure UI resets even if auth event is slow.
      setSignedInEmail(null);
      window.location.href = "/";
    } catch (e: any) {
      setStatus(`Sign out failed: ${e?.message ?? String(e)}`);
      setSigningOut(false);
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
                  href="/app/today"
                >
                  Open app
                </a>
                <button
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                  onClick={signOut}
                  type="button"
                  disabled={signingOut}
                >
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-base font-semibold">Sign in</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Password is the default. Magic link is still available.
              </p>

              <div className="mt-4 flex rounded-xl border border-white/10 bg-black/20 p-1">
                <button
                  type="button"
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                    mode === "password" ? "bg-white text-black" : "text-white/80 hover:bg-white/5"
                  }`}
                  onClick={() => {
                    setMode("password");
                    setStatus("");
                  }}
                >
                  Password
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                    mode === "magic" ? "bg-white text-black" : "text-white/80 hover:bg-white/5"
                  }`}
                  onClick={() => {
                    setMode("magic");
                    setStatus("");
                  }}
                >
                  Magic link
                </button>
              </div>

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

              {mode === "password" ? (
                <>
                  <label className="mt-4 block text-xs font-medium text-neutral-300">Password</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-base text-white placeholder:text-neutral-500"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />

                  <button
                    className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-50"
                    onClick={signInWithPassword}
                    disabled={!email || !password}
                  >
                    Sign in
                  </button>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                      onClick={createAccountWithPassword}
                      disabled={!email || !password}
                    >
                      Create account
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                      onClick={resetPassword}
                      disabled={!email}
                    >
                      Reset password
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-50"
                    onClick={signInWithMagicLink}
                    disabled={!email}
                  >
                    Send magic link
                  </button>
                </>
              )}

              {status ? <p className="mt-3 text-xs text-neutral-400">{status}</p> : null}
            </section>
          )}

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold">See it</h3>
            <p className="mt-1 text-sm text-neutral-400">
              Here’s what a filled-in week looks like.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {/* Mock: Routines */}
              <a
                href="/app/today"
                className="rounded-2xl border border-white/10 bg-black/20 p-2 hover:bg-white/5"
              >
                <div className="h-64 w-full rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-white">Routines</p>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-neutral-300">
                      Today
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {[
                      { t: "🚶 Walk", core: true, done: true },
                      { t: "🏋️ Strength", core: true, done: false },
                      { t: "💧 Water", core: true, done: true },
                      { t: "💊 Supplements", core: false, done: true },
                      { t: "🧘 Meditate", core: false, done: false },
                      { t: "🛌 Bedtime", core: true, done: false },
                    ].map((row) => (
                      <div
                        key={row.t}
                        className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                      >
                        <span className="min-w-0 flex-1 truncate text-xs text-neutral-100">
                          {row.t}
                        </span>
                        <div className="flex shrink-0 items-center gap-2">
                          {row.core ? (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-neutral-200">
                              CORE
                            </span>
                          ) : null}
                          <span
                            className={
                              row.done
                                ? "h-2.5 w-2.5 rounded-full bg-emerald-400"
                                : "h-2.5 w-2.5 rounded-full bg-white/15"
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="mt-2 text-xs text-neutral-400">Routines</p>
              </a>

              {/* Mock: Progress */}
              <a
                href="/app/routines/progress"
                className="rounded-2xl border border-white/10 bg-black/20 p-2 hover:bg-white/5"
              >
                <div className="h-64 w-full rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-white">Progress</p>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] text-emerald-200">
                      Core streak: 3
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-7 gap-1">
                    {[
                      "green",
                      "green",
                      "yellow",
                      "green",
                      "red",
                      "green",
                      "green",
                      "green",
                      "yellow",
                      "green",
                      "green",
                      "green",
                      "yellow",
                      "green",
                      "green",
                      "green",
                      "green",
                      "red",
                      "green",
                      "green",
                      "green",
                      "yellow",
                      "green",
                      "green",
                      "green",
                      "green",
                      "yellow",
                      "green",
                    ].map((c, idx) => (
                      <div
                        key={idx}
                        className={
                          c === "green"
                            ? "h-4 w-4 rounded bg-emerald-500/70"
                            : c === "yellow"
                              ? "h-4 w-4 rounded bg-amber-400/70"
                              : "h-4 w-4 rounded bg-rose-500/60"
                        }
                      />
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                      <p className="text-[10px] text-neutral-400">Rowing</p>
                      <p className="text-sm font-semibold">3/5</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                      <p className="text-[10px] text-neutral-400">Walking</p>
                      <p className="text-sm font-semibold">12.4 mi</p>
                    </div>
                  </div>
                </div>

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

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold">Install on iPhone</h3>
            <ol className="mt-3 space-y-2 text-sm text-neutral-300">
              <li>1) Open this site in Safari.</li>
              <li>2) Tap the Share button, then “Add to Home Screen”.</li>
              <li>3) Launch from your Home Screen like a real app.</li>
            </ol>
            <p className="mt-3 text-xs text-neutral-500">
              Passkeys (Face ID) login is next.
            </p>
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
