"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { clearSessionCookies } from "@/lib/sessionCookie";
import { BrandIcon } from "@/app/app/_components/BrandIcon";
import { hapticLight, hapticMedium } from "@/lib/haptics";

type AuthState = "checking" | "signed-in" | "signed-out";

/** Check synchronously if returning user (has auth flag cookie) */
function hasSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("r365_sb.flag=");
}

/** Detect Capacitor native shell */
function isNative(): boolean {
  if (typeof window === "undefined") return false;
  // @ts-expect-error - Capacitor global
  return !!window.Capacitor;
}

export default function Home() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "create" | "magic" | "forgot">("signin");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // ── Session check: fast path for returning users ──
  useEffect(() => {
    if (!hasSessionCookie()) setAuthState("signed-out");

    let cancelled = false;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const check = async () => {
      try {
        let { data } = await supabase.auth.getSession();

        if (!data.session) {
          for (const delay of [0, 250, 800]) {
            if (delay) await sleep(delay);
            try { await supabase.auth.refreshSession(); } catch { /* ignore */ }
            data = (await supabase.auth.getSession()).data;
            if (data.session) break;
          }
        }

        if (cancelled) return;
        if (data.session) {
          setSignedInEmail(data.session.user.email ?? null);
          setAuthState("signed-in");
        } else {
          setAuthState("signed-out");
        }
      } catch {
        if (!cancelled) setAuthState("signed-out");
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

  useEffect(() => {
    if (authState !== "signed-in") return;
    let target = "/app/today";
    if (typeof window !== "undefined") {
      const next = new URLSearchParams(window.location.search).get("next");
      if (next?.startsWith("/")) target = next;
    }
    router.replace(target);
  }, [authState, router]);

  const getSiteUrl = () =>
    (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")) ||
    (typeof window !== "undefined" ? window.location.origin : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    hapticMedium();
    setBusy(true);
    setStatus("");

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "create") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${getSiteUrl()}/` },
        });
        if (error) throw error;
        if (data.session) { setAuthState("signed-in"); return; }
        setStatus("Account created! Check your inbox to confirm your email.");
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
    hapticLight();
    setBusy(true);
    try {
      await supabase.auth.signOut();
      clearSessionCookies();
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
        <div className="text-center space-y-5 animate-fade-in">
          <div className="mx-auto" style={{ width: 72 }}>
            <BrandIcon size={72} />
          </div>
          <div>
            <p className="text-xl font-semibold uppercase" style={{ letterSpacing: "0.06em" }}>ROUTINES365</p>
            <p className="text-xs text-neutral-500 mt-1.5">Stack your days. Change your life.</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-white/40 animate-pulse" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: "0.15s" }} />
            <div className="h-1.5 w-1.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: "0.3s" }} />
          </div>
        </div>
      </main>
    );
  }

  const native = isNative();

  // ── SIGN-IN / LANDING PAGE ──
  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="mx-auto w-full max-w-md px-6 py-8" style={{ paddingTop: "max(env(safe-area-inset-top, 32px), 32px)" }}>

        {/* ── Hero — compact in native ── */}
        <header className="space-y-4 text-center">
          <div className="mx-auto" style={{ width: native ? 72 : 96 }}>
            <BrandIcon size={native ? 72 : 96} />
          </div>
          <div>
            <h1 className={`font-semibold uppercase ${native ? "text-2xl" : "text-3xl"}`} style={{ letterSpacing: "0.06em" }}>ROUTINES365</h1>
            <p className="mt-2 text-sm font-medium text-emerald-400">Stack your days. Change your life.</p>
            {!native && (
              <p className="mt-2 text-sm text-neutral-400 leading-relaxed max-w-xs mx-auto">
                The daily habit tracker that keeps it simple — check off your core habits, build streaks, and watch consistency compound.
              </p>
            )}
          </div>
          {!native && (
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {[
                { emoji: "⚡", top: "One-tap", bot: "Check off in seconds" },
                { emoji: "🟢", top: "Green days", bot: "See your wins" },
                { emoji: "🔥", top: "Streaks", bot: "Stay motivated" },
              ].map(({ emoji, top, bot }) => (
                <div key={top} className="rounded-2xl border border-white/10 bg-white/5 px-2 py-3 text-neutral-300">
                  <span className="text-lg">{emoji}</span>
                  <div className="mt-1 font-semibold">{top}</div>
                  <div className="mt-0.5 text-[10px] text-neutral-500">{bot}</div>
                </div>
              ))}
            </div>
          )}
        </header>

        {/* ── Auth form ── */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          {signedInEmail ? (
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

              <label className="mt-4 block text-sm font-medium text-neutral-400">Email</label>
              <input className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email" inputMode="email"
                required autoFocus />

              {(mode === "signin" || mode === "create") && (
                <>
                  <label className="mt-3 block text-sm font-medium text-neutral-400">Password</label>
                  <div className="relative mt-1.5">
                    <input className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 pr-12 text-base text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                      type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" autoComplete={mode === "create" ? "new-password" : "current-password"}
                      required minLength={mode === "create" ? 8 : undefined} />
                    <button type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-500 px-1 py-1"
                      onClick={() => { hapticLight(); setShowPassword(!showPassword); }}
                      tabIndex={-1}>
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </>
              )}

              <button type="submit" disabled={busy}
                className="mt-4 w-full rounded-xl bg-white px-4 py-3.5 text-base font-bold text-black disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                {busy ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                    {mode === "signin" ? "Signing in…" : mode === "create" ? "Creating…" : "Sending…"}
                  </>
                ) : (
                  mode === "signin" ? "Sign in" : mode === "create" ? "Create account" : mode === "magic" ? "Send magic link" : "Send reset link"
                )}
              </button>

              {status && (
                <p className={`mt-3 text-xs ${status.startsWith("Check") || status.startsWith("Account") ? "text-emerald-400" : "text-red-400"}`}>
                  {status}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                {mode !== "signin" && (
                  <button type="button" className="underline-offset-2 underline"
                    onClick={() => { hapticLight(); setMode("signin"); setStatus(""); setShowPassword(false); }}>
                    Sign in with password
                  </button>
                )}
                {mode !== "create" && (
                  <button type="button" className="underline-offset-2 underline"
                    onClick={() => { hapticLight(); setMode("create"); setStatus(""); setShowPassword(false); }}>
                    Create account
                  </button>
                )}
                {mode !== "magic" && (
                  <button type="button" className="underline-offset-2 underline"
                    onClick={() => { hapticLight(); setMode("magic"); setStatus(""); setShowPassword(false); }}>
                    Magic link (no password)
                  </button>
                )}
                {mode === "signin" && (
                  <button type="button" className="underline-offset-2 underline"
                    onClick={() => { hapticLight(); setMode("forgot"); setStatus(""); setShowPassword(false); }}>
                    Forgot password?
                  </button>
                )}
              </div>
            </form>
          )}
        </section>

        {/* ── How it works — hidden in native ── */}
        {!native && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-xs font-bold tracking-wider uppercase text-neutral-500 mb-4">How it works</h3>
            <div className="space-y-4 text-sm text-neutral-300">
              {[
                { n: "1", t: "Pick your habits", d: "Choose from 75+ built-in routines or create your own" },
                { n: "2", t: "Mark your CORE", d: "Tag 3–5 non-negotiable habits that define a green day" },
                { n: "3", t: "Check off daily", d: "One tap per habit — done in under 30 seconds" },
                { n: "4", t: "Watch streaks grow", d: "Consistency compounds. See your calendar fill with green" },
              ].map(({ n, t, d }) => (
                <div key={n} className="flex items-start gap-3">
                  <span className="shrink-0 flex items-center justify-center rounded-full text-xs font-bold"
                    style={{ width: 24, height: 24, background: "rgba(16,185,129,0.15)", color: "rgb(16,185,129)" }}>
                    {n}
                  </span>
                  <div>
                    <span className="font-semibold text-neutral-200">{t}</span>
                    <p className="text-xs text-neutral-500 mt-0.5">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Features — compact in native ── */}
        {!native && (
          <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="space-y-3 text-sm text-neutral-300">
              {[
                { e: "🏆", t: "Trophies and milestones that celebrate your wins" },
                { e: "📊", t: "Progress calendar, activity totals, and trend analytics" },
                { e: "💪", t: "Modular design — add fitness, sleep, journal, and more" },
                { e: "📱", t: "Installs as a PWA — feels native on iPhone and Android" },
                { e: "🔒", t: "Private and secure — your data stays yours" },
              ].map(({ e, t }) => (
                <div key={t} className="flex items-start gap-3">
                  <span className="text-base shrink-0 mt-0.5">{e}</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Install instructions — NEVER shown in native ── */}
        {!native && (
          <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-bold">📱 Install on your phone</h3>
            <div className="mt-2 space-y-1.5 text-sm text-neutral-400">
              <p><strong className="text-neutral-200">iPhone:</strong> Open in Safari → Share → Add to Home Screen</p>
              <p><strong className="text-neutral-200">Android:</strong> Chrome menu → Install app</p>
              <p className="text-xs text-neutral-500 mt-2">Launches full-screen with no browser bar — feels like a native app.</p>
            </div>
          </section>
        )}

        <footer className="mt-6 text-center space-y-2 pb-6">
          <p className="text-xs text-neutral-500">Routines365 — Stack your days. Change your life.</p>
          <div className="text-xs text-neutral-600 space-x-3">
            <a className="transition-colors" href="/privacy">Privacy</a>
            <a className="transition-colors" href="/terms">Terms</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
