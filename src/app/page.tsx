"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { clearSessionCookies } from "@/lib/sessionCookie";
import { BrandIcon } from "@/app/app/_components/BrandIcon";
import { hapticLight, hapticMedium } from "@/lib/haptics";

type AuthState = "checking" | "signed-in" | "signed-out";

function hasSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("r365_sb.flag=");
}

function isNative(): boolean {
  if (typeof window === "undefined") return false;
  // @ts-expect-error - Capacitor global
  return !!window.Capacitor;
}

// ── Feature data ──
const FEATURES = [
  {
    emoji: "✅",
    title: "One-Tap Daily Checklist",
    desc: "Mark habits as Core or Bonus. Complete your core habits to earn a green day. Takes 10 seconds.",
  },
  {
    emoji: "📓",
    title: "Guided Journal",
    desc: "Gratitude prompts, daily intention, and reflection — or free write. Auto-checks your journal habit on save.",
  },
  {
    emoji: "🌬️",
    title: "Breathwork & Qigong",
    desc: "Box Breathing, 4-7-8, Wim Hof, Physiological Sigh with Om audio. Plus Qigong movement routines.",
  },
  {
    emoji: "🔥",
    title: "Streaks & Trophies",
    desc: "Build daily streaks with milestones at 7, 30, 100, and 365 days. Earn trophies. Complete weekly quests.",
  },
  {
    emoji: "❤️",
    title: "Apple Health Integration",
    desc: "See sleep, HRV, heart rate, steps, and SpO2. Habits auto-complete when your health data hits goals.",
  },
  {
    emoji: "👥",
    title: "Accountability Partner",
    desc: "Invite a friend and track each other's progress. Send cheers when they hit milestones.",
  },
  {
    emoji: "🎯",
    title: "Focus Timer",
    desc: "Pomodoro sessions to protect your deep work. Track completed focus blocks alongside your habits.",
  },
  {
    emoji: "📊",
    title: "Progress & Insights",
    desc: "Beautiful calendar, sleep stage charts, day-of-week patterns, and AI-powered insights that get smarter.",
  },
];

const HOW_IT_WORKS = [
  { n: "1", t: "Pick your habits", d: "Choose from 45+ built-in routines or create your own. Morning, fitness, mindfulness, and more." },
  { n: "2", t: "Mark your CORE", d: "Tag 3–5 non-negotiable habits that define a successful day." },
  { n: "3", t: "Check off daily", d: "One tap per habit — done in under 10 seconds. Activity logging for steps, workouts, and more." },
  { n: "4", t: "Watch streaks grow", d: "See your calendar fill with green. Earn trophies, complete quests, journal your reflections." },
];

const PREMIUM_PERKS = [
  "Biometric insights — HRV trends, resting heart rate analysis",
  "Sleep stage breakdown — Deep, Core, REM with 7-night trends",
  "Health auto-complete — habits check themselves from Apple Health",
  "Unlimited habits, streak freezes, and detailed reports",
  "Custom themes, share cards, and per-habit analytics",
];

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
        } else { setAuthState("signed-out"); }
      } catch { if (!cancelled) setAuthState("signed-out"); }
    };
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session?.user.id) {
        const prevUserId = localStorage.getItem("routines365:userId");
        if (prevUserId && prevUserId !== session.user.id) {
          const keys = Object.keys(localStorage).filter((k) => k.startsWith("routines365:") && k !== "routines365:userId");
          keys.forEach((k) => localStorage.removeItem(k));
        }
        localStorage.setItem("routines365:userId", session.user.id);
      }
      setSignedInEmail(session?.user.email ?? null);
      setAuthState(session ? "signed-in" : "signed-out");
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (authState !== "signed-in") return;
    router.replace("/app/today");
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
    } finally { setBusy(false); }
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
    } catch { setBusy(false); }
  };

  // ── SPLASH ──
  if (authState === "checking" || authState === "signed-in") {
    return (
      <main className="min-h-dvh bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-5 animate-fade-in">
          <div className="mx-auto" style={{ width: 72 }}><BrandIcon size={72} /></div>
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

  // ── LANDING PAGE ──
  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="mx-auto w-full max-w-md px-6 py-8" style={{ paddingTop: "max(env(safe-area-inset-top, 32px), 32px)" }}>

        {/* ── Hero ── */}
        <header className="space-y-4 text-center">
          <div className="mx-auto" style={{ width: native ? 72 : 96 }}>
            <BrandIcon size={native ? 72 : 96} />
          </div>
          <div>
            <h1 className={`font-semibold uppercase ${native ? "text-2xl" : "text-3xl"}`}
              style={{ letterSpacing: "0.06em" }}>ROUTINES365</h1>
            <p className="mt-2 text-sm font-medium text-emerald-400">Stack your days. Change your life.</p>
            {!native && (
              <p className="mt-3 text-sm text-neutral-400 leading-relaxed max-w-xs mx-auto">
                The daily habit tracker with guided journaling, breathwork, streaks, and Apple Health — built for people who want to get 1% better every day.
              </p>
            )}
          </div>

          {/* Quick stats */}
          {!native && (
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {[
                { emoji: "⚡", top: "10 seconds", bot: "Daily check-in" },
                { emoji: "📓", top: "Journal", bot: "Guided prompts" },
                { emoji: "🔥", top: "Streaks", bot: "365-day milestones" },
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

        {/* ── Features grid — web only ── */}
        {!native && (
          <section className="mt-6">
            <h2 className="text-xs font-bold tracking-wider uppercase text-neutral-500 mb-4 px-1">
              Everything you need to build better habits
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {FEATURES.map(({ emoji, title, desc }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0 mt-0.5">{emoji}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-200">{title}</h3>
                      <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── How it works — web only ── */}
        {!native && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xs font-bold tracking-wider uppercase text-neutral-500 mb-4">How it works</h2>
            <div className="space-y-4 text-sm text-neutral-300">
              {HOW_IT_WORKS.map(({ n, t, d }) => (
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

        {/* ── Premium — web only ── */}
        {!native && (
          <section className="mt-4 rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-5">
            <h2 className="text-sm font-bold text-emerald-400 mb-1">Routines365 Premium</h2>
            <p className="text-xs text-neutral-500 mb-4">7-day free trial · $3.99/mo or $29.99/yr</p>
            <div className="space-y-2.5">
              {PREMIUM_PERKS.map((perk) => (
                <div key={perk} className="flex items-start gap-2.5">
                  <span className="text-emerald-400 text-xs mt-0.5 shrink-0">✦</span>
                  <span className="text-sm text-neutral-300">{perk}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Install instructions — web only ── */}
        {!native && (
          <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-sm font-bold">📱 Install on your phone</h2>
            <div className="mt-2 space-y-1.5 text-sm text-neutral-400">
              <p><strong className="text-neutral-200">iPhone:</strong> Open in Safari → Share → Add to Home Screen</p>
              <p><strong className="text-neutral-200">Android:</strong> Chrome menu → Install app</p>
              <p className="text-xs text-neutral-500 mt-2">Launches full-screen — feels like a native app.</p>
            </div>
          </section>
        )}

        {/* ── SEO content — web only, visually subtle ── */}
        {!native && (
          <section className="mt-6 space-y-3 text-xs text-neutral-600 leading-relaxed px-1">
            <p>
              Routines365 is a daily habit tracker designed for people who want to build consistent morning routines, track fitness goals, practice breathwork, and journal with guided gratitude prompts. Whether you're building a Wim Hof breathing practice, tracking steps with Apple Health, or simply checking off your daily habits, Routines365 makes consistency simple.
            </p>
            <p>
              Features include streak tracking with milestones at 7, 14, 30, 50, 100, and 365 days; a guided journal with gratitude, intention, and reflection prompts; five breathwork techniques with audio cues; Qigong movement routines; Apple Health integration for sleep, HRV, heart rate, and steps; an accountability partner system; Pomodoro focus timer; activity logging for workouts and recovery; and a beautiful progress calendar that shows your consistency at a glance.
            </p>
            <p>
              Available as a native iOS app and progressive web app (PWA). Free to start with optional premium upgrade for biometric insights, sleep stage analysis, health auto-complete, unlimited habits, and custom themes.
            </p>
          </section>
        )}

        <footer className="mt-6 text-center space-y-2 pb-6">
          <p className="text-xs text-neutral-500">Routines365 — Stack your days. Change your life.</p>
          <div className="text-xs text-neutral-600 space-x-3">
            <a className="transition-colors hover:text-neutral-400" href="/privacy">Privacy</a>
            <a className="transition-colors hover:text-neutral-400" href="/terms">Terms</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
