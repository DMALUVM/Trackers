"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { BrandIcon } from "@/app/app/_components/BrandIcon";
import { hapticLight, hapticMedium } from "@/lib/haptics";

function hasSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("r365_sb.flag=");
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "create" | "magic" | "forgot">("create");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isNativeApp] = useState(() => {
    if (typeof window === "undefined") return false;
    // Capacitor sets this on the window object
    return !!(window as unknown as Record<string, unknown>).Capacitor;
  });

  /* ── Get redirect target from ?next= param ── */
  const getRedirectTarget = useCallback(() => {
    if (typeof window === "undefined") return "/app/today";
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    // Only allow internal /app/ paths
    if (next && next.startsWith("/app/")) return next;
    return "/app/today";
  }, []);

  /* ── Redirect if already signed in (silent, non-blocking) ── */
  useEffect(() => {
    if (!hasSessionCookie()) return;
    let cancelled = false;
    const check = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!cancelled && data.session) router.replace(getRedirectTarget());
      } catch {}
    };
    void check();
    return () => { cancelled = true; };
  }, [router, getRedirectTarget]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      if (session?.user.id) {
        const p = localStorage.getItem("routines365:userId");
        if (p && p !== session.user.id)
          Object.keys(localStorage)
            .filter(k => k.startsWith("routines365:") && k !== "routines365:userId")
            .forEach(k => localStorage.removeItem(k));
        localStorage.setItem("routines365:userId", session.user.id);
        router.replace(getRedirectTarget());
      }
    });
    return () => subscription.unsubscribe();
  }, [router, getRedirectTarget]);

  const getSiteUrl = useCallback(
    () => {
      // In Capacitor, window.location.origin can be capacitor://localhost which breaks email redirects
      if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).Capacitor) {
        return "https://routines365.com";
      }
      return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || (typeof window !== "undefined" ? window.location.origin : "");
    },
    []
  );

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
          options: { emailRedirectTo: `${getSiteUrl()}/login` },
        });
        if (error) throw error;
        if (data.session) { router.replace(getRedirectTarget()); return; }
        setStatus("Account created! Check your inbox to confirm.");
      } else if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${getSiteUrl()}/login` },
        });
        if (error) throw error;
        setStatus("Check your email for the sign-in link ✓");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${getSiteUrl()}/reset`,
        });
        if (error) throw error;
        setStatus("Check your email for the reset link. After resetting, come back here and sign in with your new password ✓");
      }
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-black text-white flex flex-col" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      {/* Header */}
      <header className="px-6 h-14 flex items-center justify-between max-w-md mx-auto w-full">
        <a href="/" className="flex items-center gap-2.5">
          <BrandIcon size={28} />
          <span className="text-sm font-bold tracking-wide uppercase">Routines365</span>
        </a>
      </header>

      {/* Auth form */}
      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4" style={{ width: 56 }}>
              <BrandIcon size={56} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {mode === "create" ? "Start your first green day" :
               mode === "signin" ? "Welcome back" :
               mode === "magic" ? "Magic link sign in" :
               "Reset your password"}
            </h1>
            {mode === "create" && (
              <p className="mt-2 text-sm text-neutral-500">
                Free forever. No credit card required.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1.5">Email</label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email" inputMode="email" required
              />
            </div>

            {(mode === "signin" || mode === "create") && (
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-14 text-base text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                    type={showPassword ? "text" : "password"}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === "create" ? "new-password" : "current-password"}
                    required minLength={mode === "create" ? 8 : undefined}
                  />
                  <button type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-500 px-1 py-1"
                    onClick={() => { hapticLight(); setShowPassword(!showPassword); }}
                    tabIndex={-1}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={busy}
              className="w-full rounded-xl bg-emerald-500 px-4 py-3.5 text-base font-bold text-black disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                  {mode === "signin" ? "Signing in…" : mode === "create" ? "Creating…" : "Sending…"}
                </>
              ) : mode === "signin" ? "Sign in" : mode === "create" ? "Create free account" : mode === "magic" ? "Send magic link" : "Send reset link"}
            </button>

            {status && (
              <p className={`text-sm text-center ${status.startsWith("Check") || status.startsWith("Account") ? "text-emerald-400" : "text-red-400"}`}>
                {status}
              </p>
            )}
          </form>

          {/* Mode switchers */}
          <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-neutral-500">
            {mode !== "signin" && (
              <button type="button" className="underline-offset-2 underline hover:text-neutral-300 transition"
                onClick={() => { hapticLight(); setMode("signin"); setStatus(""); setShowPassword(false); }}>
                Sign in
              </button>
            )}
            {mode !== "create" && (
              <button type="button" className="underline-offset-2 underline hover:text-neutral-300 transition"
                onClick={() => { hapticLight(); setMode("create"); setStatus(""); setShowPassword(false); }}>
                Create account
              </button>
            )}
            {mode !== "magic" && !isNativeApp && (
              <button type="button" className="underline-offset-2 underline hover:text-neutral-300 transition"
                onClick={() => { hapticLight(); setMode("magic"); setStatus(""); setShowPassword(false); }}>
                Magic link
              </button>
            )}
            {mode !== "forgot" && (
              <button type="button" className="underline-offset-2 underline hover:text-neutral-300 transition"
                onClick={() => { hapticLight(); setMode("forgot"); setStatus(""); setShowPassword(false); }}>
                Forgot password?
              </button>
            )}
          </div>

          {/* Launch pricing nudge */}
          {mode === "create" && (
            <div className="mt-8 rounded-xl border border-emerald-800/30 px-4 py-3 text-center"
              style={{ background: "rgba(16,185,129,0.04)" }}>
              <p className="text-xs text-emerald-400 font-semibold">🚀 Start Free</p>
              <p className="text-[11px] text-neutral-500 mt-1">
                7-day free trial included with Premium · $29.99/yr ($2.49/mo)
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
