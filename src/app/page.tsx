"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

// ── Scroll-reveal hook ──
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      }}>
      {children}
    </div>
  );
}

// ── Phone Mockup ──
function PhoneMockup() {
  const coreHabits = [
    { emoji: "🌅", label: "Morning sunlight", done: true },
    { emoji: "💧", label: "Drink water", done: true },
    { emoji: "🌬️", label: "Breathwork / meditation", done: true },
    { emoji: "🏋️", label: "Exercise", done: true },
    { emoji: "📓", label: "Journal", done: false },
  ];
  const bonusHabits = [
    { emoji: "🧊", label: "Cold exposure", done: true },
    { emoji: "📚", label: "Read (10 min)", done: false },
  ];
  const coreDone = coreHabits.filter((h) => h.done).length;
  const score = Math.round(((coreDone) / coreHabits.length) * 100);
  const weekDays = [
    { label: "M", green: true },
    { label: "T", green: true },
    { label: "W", green: true },
    { label: "T", green: true },
    { label: "F", green: false },
    { label: "S", green: true },
    { label: "S", today: true },
  ];

  return (
    <div className="relative mx-auto" style={{ width: 280, perspective: "1200px" }}>
      {/* Phone frame */}
      <div className="rounded-[40px] p-2.5 shadow-2xl"
        style={{
          background: "linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 60px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06) inset",
        }}>
        {/* Screen */}
        <div className="rounded-[32px] overflow-hidden relative" style={{ background: "#0a2e1c" }}>
          {/* Notch */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-24 h-6 rounded-full" style={{ background: "#000" }} />
          </div>

          {/* Content */}
          <div className="px-4 pb-5 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Good morning 👋</p>
                <p className="text-sm font-bold text-white">
                  Sunday <span className="text-[10px] font-normal" style={{ color: "rgba(255,255,255,0.5)" }}>Feb 10</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <span style={{ fontSize: 10 }}>🏆</span>
                </div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <span style={{ fontSize: 8 }}>•••</span>
                </div>
              </div>
            </div>

            {/* Score card */}
            <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3">
                {/* Mini progress ring */}
                <div className="relative shrink-0" style={{ width: 52, height: 52 }}>
                  <svg viewBox="0 0 52 52" className="w-full h-full -rotate-90">
                    <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                    <circle cx="26" cy="26" r="22" fill="none" stroke="#10b981" strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - score / 100)}`} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                    {score}%
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-white">Almost there!</p>
                  <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.5)" }}>{coreDone}/{coreHabits.length} core</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span style={{ fontSize: 10 }}>🔥</span>
                    <span className="text-[10px] font-bold text-white">6</span>
                    <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.4)" }}>day streak</span>
                  </div>
                </div>
              </div>

              {/* Week strip */}
              <div className="flex justify-between mt-2.5 px-1">
                {weekDays.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <span className="text-[7px] font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>{d.label}</span>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px]"
                      style={{
                        background: d.today ? "rgba(16,185,129,0.2)" : d.green ? "#10b981" : "rgba(255,255,255,0.06)",
                        border: d.today ? "1.5px solid #10b981" : "none",
                        color: d.green && !d.today ? "#000" : "rgba(255,255,255,0.5)",
                        fontWeight: 700,
                      }}>
                      {d.green && !d.today ? "✓" : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { icon: "🌬️", label: "Breathwork", color: "#6366f1" },
                { icon: "🧘", label: "Movement", color: "#10b981" },
                { icon: "🎯", label: "Focus", color: "#3b82f6" },
              ].map((a) => (
                <div key={a.label} className="rounded-xl py-2 text-center"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-xs">{a.icon}</span>
                  <p className="text-[7px] font-semibold mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{a.label}</p>
                </div>
              ))}
            </div>

            {/* Core habits */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[8px] font-bold tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>Core</span>
                <span className="text-[8px] font-semibold" style={{ color: "#10b981" }}>{coreDone}/{coreHabits.length}</span>
              </div>
              <div className="space-y-1">
                {coreHabits.map((h) => (
                  <div key={h.label} className="flex items-center gap-2 rounded-xl px-2.5 py-1.5"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{
                        background: h.done ? "#10b981" : "transparent",
                        border: h.done ? "none" : "1.5px solid rgba(255,255,255,0.2)",
                      }}>
                      {h.done && <span className="text-[9px] text-black font-bold">✓</span>}
                    </div>
                    <span className="text-[9px]">{h.emoji}</span>
                    <span className={`text-[10px] ${h.done ? "line-through" : ""}`}
                      style={{ color: h.done ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.85)" }}>
                      {h.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bonus habits */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[8px] font-bold tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>Bonus</span>
                <span className="text-[8px] font-semibold" style={{ color: "rgba(255,255,255,0.25)" }}>1/2</span>
              </div>
              <div className="space-y-1">
                {bonusHabits.map((h) => (
                  <div key={h.label} className="flex items-center gap-2 rounded-xl px-2.5 py-1.5"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                      style={{
                        background: h.done ? "#10b981" : "transparent",
                        border: h.done ? "none" : "1.5px solid rgba(255,255,255,0.15)",
                      }}>
                      {h.done && <span className="text-[7px] text-black font-bold">✓</span>}
                    </div>
                    <span className="text-[8px]">{h.emoji}</span>
                    <span className={`text-[9px] ${h.done ? "line-through" : ""}`}
                      style={{ color: h.done ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.6)" }}>
                      {h.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Glow under phone */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-20 rounded-full blur-3xl opacity-25"
        style={{ background: "#10b981" }} />
    </div>
  );
}

// ── Feature data ──
const HERO_STATS = [
  { value: "10s", label: "Daily check-in" },
  { value: "45+", label: "Built-in habits" },
  { value: "365", label: "Day streaks" },
];

const FEATURES = [
  { emoji: "✅", title: "One-tap daily checklist", desc: "Mark habits as Core or Bonus. Complete your core habits to earn a green day. It takes 10 seconds — open, check, done." },
  { emoji: "📓", title: "Guided journal", desc: "Gratitude prompts, daily intention, and reflection — or switch to free write. Your preference is saved. Saving auto-checks your journal habit." },
  { emoji: "🌬️", title: "Breathwork & Qigong", desc: "Five guided breathing techniques with Om audio cues, plus Qigong movement routines with step-by-step timers." },
  { emoji: "🔥", title: "Streaks & trophies", desc: "Build daily streaks with milestones at 7, 30, 100, and 365 days. Earn trophies. Complete weekly quests. Rest days protect your streak." },
  { emoji: "❤️", title: "Apple Health", desc: "See sleep, HRV, heart rate, steps, and SpO2 from your Apple Watch, Oura Ring, or Garmin. Habits auto-complete when data hits goals." },
  { emoji: "👥", title: "Accountability partner", desc: "Invite a friend and track each other's progress. Send cheers when they hit milestones. Stay motivated together." },
  { emoji: "🎯", title: "Focus timer", desc: "Pomodoro sessions to protect your deep work. Track completed focus blocks alongside your habits." },
  { emoji: "📊", title: "Progress & insights", desc: "Beautiful progress calendar, sleep stage charts, day-of-week patterns, and personalized insights that get smarter over time." },
];

const PREMIUM_FEATURES = [
  "Biometric insights — HRV trends, resting heart rate analysis",
  "Sleep stage breakdown — Deep, Core, REM with 7-night trends",
  "Health auto-complete — habits check themselves from Apple Health",
  "Unlimited habits, streak freezes, and detailed reports",
  "Custom themes, share cards, and per-habit analytics",
];

export default function Home() {
  const router = useRouter();
  const authRef = useRef<HTMLDivElement>(null);
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "create" | "magic" | "forgot">("signin");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // ── Session check ──
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
        if (data.session) { setSignedInEmail(data.session.user.email ?? null); setAuthState("signed-in"); }
        else { setAuthState("signed-out"); }
      } catch { if (!cancelled) setAuthState("signed-out"); }
    };
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session?.user.id) {
        const prev = localStorage.getItem("routines365:userId");
        if (prev && prev !== session.user.id) {
          Object.keys(localStorage).filter((k) => k.startsWith("routines365:") && k !== "routines365:userId").forEach((k) => localStorage.removeItem(k));
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

  const getSiteUrl = useCallback(() =>
    (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")) ||
    (typeof window !== "undefined" ? window.location.origin : ""), []);

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
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${getSiteUrl()}/` } });
        if (error) throw error;
        if (data.session) { setAuthState("signed-in"); return; }
        setStatus("Account created! Check your inbox to confirm your email.");
      } else if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${getSiteUrl()}/` } });
        if (error) throw error;
        setStatus("Check your email for the sign-in link ✓");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${getSiteUrl()}/reset` });
        if (error) throw error;
        setStatus("Check your email for the reset link ✓");
      }
    } catch (err: unknown) { setStatus(err instanceof Error ? err.message : String(err)); }
    finally { setBusy(false); }
  };

  const signOut = async () => {
    hapticLight(); setBusy(true);
    try { await supabase.auth.signOut(); clearSessionCookies(); setSignedInEmail(null); setAuthState("signed-out"); window.location.href = "/"; }
    catch { setBusy(false); }
  };

  const scrollToAuth = () => authRef.current?.scrollIntoView({ behavior: "smooth" });

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

  // ── NATIVE: minimal auth ──
  if (isNative()) {
    return (
      <main className="min-h-dvh bg-black text-white">
        <div className="mx-auto w-full max-w-md px-6 py-8" style={{ paddingTop: "max(env(safe-area-inset-top, 32px), 32px)" }}>
          <header className="space-y-4 text-center">
            <div className="mx-auto" style={{ width: 72 }}><BrandIcon size={72} /></div>
            <h1 className="text-2xl font-semibold uppercase" style={{ letterSpacing: "0.06em" }}>ROUTINES365</h1>
            <p className="text-sm font-medium text-emerald-400">Stack your days. Change your life.</p>
          </header>
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            {renderAuthForm()}
          </section>
        </div>
      </main>
    );
  }

  function renderAuthForm() {
    if (signedInEmail) {
      return (
        <div>
          <p className="text-sm text-neutral-200">Signed in as <span className="font-semibold">{signedInEmail}</span></p>
          <div className="mt-4 flex gap-2">
            <a href="/app/today" className="flex-1 rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-black">Open app →</a>
            <button type="button" disabled={busy} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50" onClick={signOut}>Sign out</button>
          </div>
        </div>
      );
    }
    return (
      <form onSubmit={handleSubmit}>
        <h2 className="text-lg font-bold">
          {mode === "signin" ? "Sign in" : mode === "create" ? "Create account" : mode === "magic" ? "Magic link" : "Reset password"}
        </h2>
        <label className="mt-4 block text-sm font-medium text-neutral-400">Email</label>
        <input className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
          type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" inputMode="email" required />
        {(mode === "signin" || mode === "create") && (
          <>
            <label className="mt-3 block text-sm font-medium text-neutral-400">Password</label>
            <div className="relative mt-1.5">
              <input className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 pr-12 text-base text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" autoComplete={mode === "create" ? "new-password" : "current-password"}
                required minLength={mode === "create" ? 8 : undefined} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-500 px-1 py-1"
                onClick={() => { hapticLight(); setShowPassword(!showPassword); }} tabIndex={-1}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </>
        )}
        <button type="submit" disabled={busy}
          className="mt-4 w-full rounded-xl bg-white px-4 py-3.5 text-base font-bold text-black disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
          {busy ? (
            <><span className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
              {mode === "signin" ? "Signing in…" : mode === "create" ? "Creating…" : "Sending…"}</>
          ) : (mode === "signin" ? "Sign in" : mode === "create" ? "Create account" : mode === "magic" ? "Send magic link" : "Send reset link")}
        </button>
        {status && (
          <p className={`mt-3 text-xs ${status.startsWith("Check") || status.startsWith("Account") ? "text-emerald-400" : "text-red-400"}`}>{status}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
          {mode !== "signin" && <button type="button" className="underline-offset-2 underline" onClick={() => { hapticLight(); setMode("signin"); setStatus(""); setShowPassword(false); }}>Sign in</button>}
          {mode !== "create" && <button type="button" className="underline-offset-2 underline" onClick={() => { hapticLight(); setMode("create"); setStatus(""); setShowPassword(false); }}>Create account</button>}
          {mode !== "magic" && <button type="button" className="underline-offset-2 underline" onClick={() => { hapticLight(); setMode("magic"); setStatus(""); setShowPassword(false); }}>Magic link</button>}
          {mode === "signin" && <button type="button" className="underline-offset-2 underline" onClick={() => { hapticLight(); setMode("forgot"); setStatus(""); setShowPassword(false); }}>Forgot password?</button>}
        </div>
      </form>
    );
  }

  // ── MARKETING WEBSITE ──
  return (
    <main className="min-h-dvh bg-black text-white overflow-x-hidden">

      {/* ── Sticky nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BrandIcon size={28} />
            <span className="text-sm font-bold tracking-wide uppercase">Routines365</span>
          </div>
          <button type="button" onClick={scrollToAuth}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400">
            Get started free
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-8 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-[0.08]"
            style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)" }} />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left: copy */}
            <div className="flex-1 text-center lg:text-left">
              <Reveal>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
                  Build daily habits<br />
                  <span className="text-emerald-400">that actually stick</span>
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 text-lg text-neutral-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  The daily habit tracker with guided journaling, breathwork, streaks, and Apple Health integration. 10 seconds a day to get 1% better.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 lg:justify-start justify-center">
                  <button type="button" onClick={scrollToAuth}
                    className="w-full sm:w-auto rounded-xl bg-emerald-500 px-8 py-4 text-base font-bold text-black transition hover:bg-emerald-400 active:scale-[0.98]">
                    Start for free →
                  </button>
                  {/* Uncomment when App Store ID is available:
                  <a href="https://apps.apple.com/app/routines365/id..." className="w-full sm:w-auto">
                    <img src="/app-store-badge.svg" alt="Download on the App Store" className="h-12 mx-auto" />
                  </a> */}
                </div>
                <p className="mt-4 text-xs text-neutral-600 lg:text-left text-center">
                  Free forever · Premium from $3.99/mo · No credit card required
                </p>
              </Reveal>

              {/* Stats */}
              <Reveal delay={0.3}>
                <div className="mt-10 flex justify-center lg:justify-start gap-10">
                  {HERO_STATS.map(({ value, label }) => (
                    <div key={label}>
                      <div className="text-3xl font-extrabold text-emerald-400">{value}</div>
                      <div className="mt-0.5 text-xs text-neutral-500 font-medium">{label}</div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Right: phone mockup */}
            <Reveal delay={0.15} className="shrink-0">
              <PhoneMockup />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Compatibility bar ── */}
      <Reveal>
        <section className="border-y border-white/5 py-6 px-6">
          <div className="mx-auto max-w-3xl flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-neutral-500">
            <span>🍎 Apple Health</span>
            <span className="hidden sm:inline text-neutral-700">·</span>
            <span>⌚ Apple Watch</span>
            <span className="hidden sm:inline text-neutral-700">·</span>
            <span>💍 Oura Ring</span>
            <span className="hidden sm:inline text-neutral-700">·</span>
            <span>🏃 Garmin</span>
            <span className="hidden sm:inline text-neutral-700">·</span>
            <span>📱 iOS App</span>
          </div>
        </section>
      </Reveal>

      {/* ── Features grid ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Everything you need,<br />nothing you don&apos;t
              </h2>
              <p className="mt-4 text-neutral-500 text-base max-w-lg mx-auto">
                Most habit trackers overwhelm you on day one. Routines365 starts simple and grows with you.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map(({ emoji, title, desc }, i) => (
              <Reveal key={title} delay={0.05 * i}>
                <div className="group rounded-2xl border border-white/[0.06] p-6 transition-colors hover:border-white/[0.12] hover:bg-white/[0.02] h-full">
                  <span className="text-2xl">{emoji}</span>
                  <h3 className="mt-3 text-base font-bold text-neutral-100">{title}</h3>
                  <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-6" style={{ background: "rgba(16,185,129,0.03)" }}>
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-center text-3xl sm:text-4xl font-extrabold tracking-tight mb-14">How it works</h2>
          </Reveal>
          <div className="space-y-8">
            {[
              { n: "1", t: "Pick your habits", d: "Choose from 45+ built-in habits across morning, fitness, mindfulness, and more — or create your own." },
              { n: "2", t: "Mark your Core", d: "Tag 3–5 non-negotiable habits. Complete them all and you earn a green day." },
              { n: "3", t: "Check off daily", d: "One tap per habit. Log activities, journal your reflections, practice breathwork. Under 10 seconds for a quick check-in." },
              { n: "4", t: "Watch consistency compound", d: "Build streaks, earn trophies, fill your calendar with green. Insights reveal patterns and help you improve." },
            ].map(({ n, t, d }, i) => (
              <Reveal key={n} delay={0.08 * i}>
                <div className="flex gap-5">
                  <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold"
                    style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>{n}</div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-100">{t}</h3>
                    <p className="mt-1 text-sm text-neutral-500 leading-relaxed">{d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Premium ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <div className="rounded-3xl border border-emerald-800/40 p-8 sm:p-10"
              style={{ background: "linear-gradient(180deg, rgba(16,185,129,0.06) 0%, rgba(16,185,129,0.02) 100%)" }}>
              <div className="text-center">
                <p className="text-xs font-bold tracking-wider uppercase text-emerald-400 mb-2">Premium</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Go deeper with insights</h2>
                <p className="mt-3 text-neutral-500 text-sm">7-day free trial · $3.99/month or $29.99/year (37% off)</p>
              </div>
              <div className="mt-8 space-y-3.5">
                {PREMIUM_FEATURES.map((perk) => (
                  <div key={perk} className="flex items-start gap-3">
                    <span className="text-emerald-400 mt-0.5 shrink-0">✦</span>
                    <span className="text-sm text-neutral-300 leading-relaxed">{perk}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <button type="button" onClick={scrollToAuth}
                  className="rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-bold text-black transition hover:bg-emerald-400">
                  Try Premium free for 7 days
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA + Auth ── */}
      <section ref={authRef} className="py-20 px-6 border-t border-white/5" style={{ background: "rgba(255,255,255,0.01)" }}>
        <div className="mx-auto max-w-md text-center">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">Start your first green day</h2>
            <p className="text-neutral-500 text-sm mb-8">Free forever. No credit card required.</p>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left">{renderAuthForm()}</div>
          </Reveal>
        </div>
      </section>

      {/* ── SEO content ── */}
      <section className="py-12 px-6 border-t border-white/5">
        <div className="mx-auto max-w-3xl space-y-4 text-xs text-neutral-600 leading-relaxed">
          <p>Routines365 is a daily habit tracker designed for people who want to build consistent morning routines, track fitness goals, practice breathwork, and journal with guided gratitude prompts. Whether you&apos;re building a Wim Hof breathing practice, tracking steps with Apple Health, or simply checking off your daily habits, Routines365 makes consistency simple.</p>
          <p>Features include streak tracking with milestones at 7, 14, 30, 50, 100, and 365 days; a guided journal with gratitude, intention, and reflection prompts; five breathwork techniques with audio cues; Qigong movement routines; Apple Health integration for sleep, HRV, heart rate, and steps; an accountability partner system; Pomodoro focus timer; activity logging for workouts and recovery; and a beautiful progress calendar that shows your consistency at a glance.</p>
          <p>Available as a native iOS app and progressive web app. Free to start with optional premium upgrade for biometric insights, sleep stage analysis, health auto-complete, unlimited habits, and custom themes.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BrandIcon size={20} />
            <span className="text-xs font-bold tracking-wide uppercase text-neutral-500">Routines365</span>
          </div>
          <p className="text-xs text-neutral-600">Stack your days. Change your life.</p>
          <div className="flex items-center gap-4 text-xs text-neutral-600">
            <a className="transition-colors hover:text-neutral-400" href="/privacy">Privacy</a>
            <a className="transition-colors hover:text-neutral-400" href="/terms">Terms</a>
            <a className="transition-colors hover:text-neutral-400" href="mailto:support@routines365.com">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
