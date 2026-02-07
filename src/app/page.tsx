"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type AuthState = "checking" | "signed-in" | "signed-out";

export default function Home() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "create" | "magic" | "forgot">("signin");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);

  // ── Session check: fast path for returning users ──
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        setSignedInEmail(data.session.user.email ?? null);
        setAuthState("signed-in");
      } else {
        setAuthState("signed-out");
      }
    };
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setSignedInEmail(session?.user.email ?? null);
      setAuthState(session ? "signed-in" : "signed-out");
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  // ── Auto-redirect when signed in ──
  useEffect(() => {
    if (authState !== "signed-in") return;
    let target = "/app/today";
    if (typeof window !== "undefined") {
      const next = new URLSearchParams(window.location.search).get("next");
      if (next?.startsWith("/")) target = next;
    }
    // Immediate redirect — no 300ms delay
    router.replace(target);
  }, [authState, router]);

  // ── Helpers ──
  const getSiteUrl = () =>
    (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")) ||
    (typeof window !== "undefined" ? window.location.origin : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setStatus("");

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "create") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${getSiteUrl()}/` },
        });
        if (error) throw error;
        setStatus("Account created! Check your inbox if email confirmation is required.");
      } else if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${getSiteUrl()}/` },
        });
        if (error) throw error;
        setStatus("Check your email for the sign-in link ✓");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${getSiteUrl()}/reset`,
        });
        if (error) throw error;
        setStatus("Check your email for the reset link ✓");
      }
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    try {
      await supabase.auth.signOut();
      setSignedInEmail(null);
      setAuthState("signed-out");
      window.location.href = "/";
    } catch {
      setBusy(false);
    }
  };

  // ── SPLASH: shown while checking session ──
  if (authState === "checking" || authState === "signed-in") {
    return (
      <main className="min-h-dvh bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <img src="/brand/routines365-logo.jpg" alt="routines365"
            className="h-20 w-20 mx-auto rounded-2xl border border-white/10" />
          <div className="flex items-center justify-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-white/40 animate-pulse" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: "0.15s" }} />
            <div className="h-1.5 w-1.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: "0.3s" }} />
          </div>
        </div>
      </main>
    );
  }

  // ── SIGN-IN / LANDING PAGE ──
  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="mx-auto w-full max-w-md px-6 py-10">

        {/* ── Hero ── */}
        <header className="space-y-5 text-center">
          <img src="/brand/routines365-logo.jpg" alt="routines365"
            className="h-24 w-24 mx-auto rounded-3xl border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">routines365</h1>
            <p className="mt-2 text-sm text-neutral-400">A daily system you can actually stick with.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {[
              { top: "Fast", bot: "1-tap logging" },
              { top: "Simple", bot: "Core habits" },
              { top: "Motivating", bot: "Visible streaks" },
            ].map(({ top, bot }) => (
              <div key={top} className="rounded-2xl border border-white/10 bg-white/5 px-2 py-3 text-neutral-300">
                <span className="font-semibold">{top}</span>
                <div className="mt-1 text-[11px] text-neutral-500">{bot}</div>
              </div>
            ))}
          </div>
        </header>

        {/* ── Auth form ── */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
          {signedInEmail ? (
            /* Already signed in — should auto-redirect, but show escape hatch */
            <div>
              <p className="text-sm text-neutral-200">
                Signed in as <span className="font-semibold">{signedInEmail}</span>
              </p>
              <div className="mt-4 flex gap-2">
                <a href="/app/today"
                  className="flex-1 rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-black">
                  Open app →
                </a>
                <button type="button" disabled={busy}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  onClick={signOut}>
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 className="text-lg font-bold">
                {mode === "signin" ? "Sign in" : mode === "create" ? "Create account" : mode === "magic" ? "Magic link" : "Reset password"}
              </h2>

              {/* Email — always shown */}
              <label className="mt-4 block text-xs font-medium text-neutral-400">Email</label>
              <input className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email" inputMode="email"
                required autoFocus />

              {/* Password — only for signin and create */}
              {(mode === "signin" || mode === "create") && (
                <>
                  <label className="mt-3 block text-xs font-medium text-neutral-400">Password</label>
                  <input className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" autoComplete={mode === "create" ? "new-password" : "current-password"}
                    required minLength={mode === "create" ? 8 : undefined} />
                </>
              )}

              {/* Primary action */}
              <button type="submit" disabled={busy}
                className="mt-4 w-full rounded-xl bg-white px-4 py-3.5 text-sm font-bold text-black disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                {busy ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                    {mode === "signin" ? "Signing in…" : mode === "create" ? "Creating…" : "Sending…"}
                  </>
                ) : (
                  mode === "signin" ? "Sign in" : mode === "create" ? "Create account" : mode === "magic" ? "Send magic link" : "Send reset link"
                )}
              </button>

              {/* Status message */}
              {status && (
                <p className={`mt-3 text-xs ${status.startsWith("Check") || status.startsWith("Account") ? "text-emerald-400" : "text-red-400"}`}>
                  {status}
                </p>
              )}

              {/* Mode switchers — collapsed, uncluttered */}
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                {mode !== "signin" && (
                  <button type="button" className="hover:text-neutral-300 transition-colors underline-offset-2 hover:underline"
                    onClick={() => { setMode("signin"); setStatus(""); }}>
                    Sign in with password
                  </button>
                )}
                {mode !== "create" && (
                  <button type="button" className="hover:text-neutral-300 transition-colors underline-offset-2 hover:underline"
                    onClick={() => { setMode("create"); setStatus(""); }}>
                    Create account
                  </button>
                )}
                {mode !== "magic" && (
                  <button type="button" className="hover:text-neutral-300 transition-colors underline-offset-2 hover:underline"
                    onClick={() => { setMode("magic"); setStatus(""); }}>
                    Magic link (no password)
                  </button>
                )}
                {mode === "signin" && (
                  <button type="button" className="hover:text-neutral-300 transition-colors underline-offset-2 hover:underline"
                    onClick={() => { setMode("forgot"); setStatus(""); }}>
                    Forgot password?
                  </button>
                )}
              </div>
            </form>
          )}
        </section>

        {/* ── Features (compact) ── */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="space-y-3 text-sm text-neutral-300">
            {[
              { e: "⚡", t: "One-tap habit tracking with haptic feedback" },
              { e: "🟢", t: "Green/yellow/red days — always know where you stand" },
              { e: "🔥", t: "Streaks, progress calendar, and weekly stats" },
              { e: "🚣", t: "Activity logging with WTD/MTD/YTD totals" },
              { e: "📱", t: "Install as a PWA — works offline on iPhone" },
            ].map(({ e, t }) => (
              <div key={t} className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">{e}</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Install instructions ── */}
        <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-bold">Install on iPhone</h3>
          <div className="mt-2 space-y-1.5 text-sm text-neutral-400">
            <p>1. Open in Safari → Tap <strong className="text-neutral-200">Share</strong> → <strong className="text-neutral-200">Add to Home Screen</strong></p>
            <p>2. Launch from Home Screen for full-screen, native app feel.</p>
          </div>
        </section>

        <footer className="mt-8 flex items-center justify-between text-xs text-neutral-600">
          <span>routines365</span>
          <span className="space-x-3">
            <a className="hover:text-neutral-400 transition-colors" href="/privacy">Privacy</a>
            <a className="hover:text-neutral-400 transition-colors" href="/terms">Terms</a>
          </span>
        </footer>
      </div>
    </main>
  );
}
