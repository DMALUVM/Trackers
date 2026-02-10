"use client";

import { useCallback, useEffect, useState } from "react";
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

/**
 * AuthBlock renders:
 * - Nothing while auth is being checked (AuthOverlay handles the splash)
 * - A full-screen native auth screen if in Capacitor
 * - An inline auth form when signed out on web
 */
export function AuthBlock() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "create" | "magic" | "forgot">(
    "signin"
  );
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  /* ── Session check ── */
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
            try {
              await supabase.auth.refreshSession();
            } catch {}
            data = (await supabase.auth.getSession()).data;
            if (data.session) break;
          }
        }
        if (cancelled) return;
        if (data.session) {
          setSignedInEmail(data.session.user.email ?? null);
          setAuthState("signed-in");
        } else setAuthState("signed-out");
      } catch {
        if (!cancelled) setAuthState("signed-out");
      }
    };
    void check();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_ev, session) => {
      if (cancelled) return;
      if (session?.user.id) {
        const p = localStorage.getItem("routines365:userId");
        if (p && p !== session.user.id)
          Object.keys(localStorage)
            .filter(
              (k) =>
                k.startsWith("routines365:") && k !== "routines365:userId"
            )
            .forEach((k) => localStorage.removeItem(k));
        localStorage.setItem("routines365:userId", session.user.id);
      }
      setSignedInEmail(session?.user.email ?? null);
      setAuthState(session ? "signed-in" : "signed-out");
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authState === "signed-in") router.replace("/app/today");
  }, [authState, router]);

  const getSiteUrl = useCallback(
    () =>
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      (typeof window !== "undefined" ? window.location.origin : ""),
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
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else if (mode === "create") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${getSiteUrl()}/` },
        });
        if (error) throw error;
        if (data.session) {
          setAuthState("signed-in");
          return;
        }
        setStatus("Account created! Check your inbox to confirm.");
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

  /* ── Auth form (shared between web + native) ── */
  function renderAuthForm() {
    if (signedInEmail) {
      return (
        <div>
          <p className="text-sm text-neutral-200">
            Signed in as <span className="font-semibold">{signedInEmail}</span>
          </p>
          <div className="mt-4 flex gap-2">
            <a
              href="/app/today"
              className="flex-1 rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-black"
            >
              Open app →
            </a>
            <button
              type="button"
              disabled={busy}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              onClick={signOut}
            >
              Sign out
            </button>
          </div>
        </div>
      );
    }
    return (
      <form onSubmit={handleSubmit}>
        <h2 className="text-lg font-bold">
          {mode === "signin"
            ? "Sign in"
            : mode === "create"
              ? "Create account"
              : mode === "magic"
                ? "Magic link"
                : "Reset password"}
        </h2>
        <label className="mt-4 block text-sm font-medium text-neutral-400">
          Email
        </label>
        <input
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
          required
        />
        {(mode === "signin" || mode === "create") && (
          <>
            <label className="mt-3 block text-sm font-medium text-neutral-400">
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 pr-12 text-base text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={
                  mode === "create" ? "new-password" : "current-password"
                }
                required
                minLength={mode === "create" ? 8 : undefined}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-500 px-1 py-1"
                onClick={() => {
                  hapticLight();
                  setShowPassword(!showPassword);
                }}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-white px-4 py-3.5 text-base font-bold text-black disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {busy ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
              {mode === "signin"
                ? "Signing in…"
                : mode === "create"
                  ? "Creating…"
                  : "Sending…"}
            </>
          ) : mode === "signin" ? (
            "Sign in"
          ) : mode === "create" ? (
            "Create account"
          ) : mode === "magic" ? (
            "Send magic link"
          ) : (
            "Send reset link"
          )}
        </button>
        {status && (
          <p
            className={`mt-3 text-xs ${status.startsWith("Check") || status.startsWith("Account") ? "text-emerald-400" : "text-red-400"}`}
          >
            {status}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
          {mode !== "signin" && (
            <button
              type="button"
              className="underline-offset-2 underline"
              onClick={() => {
                hapticLight();
                setMode("signin");
                setStatus("");
                setShowPassword(false);
              }}
            >
              Sign in
            </button>
          )}
          {mode !== "create" && (
            <button
              type="button"
              className="underline-offset-2 underline"
              onClick={() => {
                hapticLight();
                setMode("create");
                setStatus("");
                setShowPassword(false);
              }}
            >
              Create account
            </button>
          )}
          {mode !== "magic" && (
            <button
              type="button"
              className="underline-offset-2 underline"
              onClick={() => {
                hapticLight();
                setMode("magic");
                setStatus("");
                setShowPassword(false);
              }}
            >
              Magic link
            </button>
          )}
          {mode === "signin" && (
            <button
              type="button"
              className="underline-offset-2 underline"
              onClick={() => {
                hapticLight();
                setMode("forgot");
                setStatus("");
                setShowPassword(false);
              }}
            >
              Forgot password?
            </button>
          )}
        </div>
      </form>
    );
  }

  /* Checking or signed-in: AuthOverlay handles the splash/redirect.
     Don't render the form yet. */
  if (authState === "checking" || authState === "signed-in") {
    return null;
  }

  /* ──────────────────────────────────────
     NATIVE: full-screen Capacitor auth
     ────────────────────────────────────── */
  if (isNative()) {
    return (
      <div className="fixed inset-0 z-[100] bg-black text-white">
        <div
          className="mx-auto w-full max-w-md px-6 py-8"
          style={{
            paddingTop: "max(env(safe-area-inset-top, 32px), 32px)",
          }}
        >
          <header className="space-y-4 text-center">
            <div className="mx-auto" style={{ width: 72 }}>
              <BrandIcon size={72} />
            </div>
            <h1
              className="text-2xl font-semibold uppercase"
              style={{ letterSpacing: "0.06em" }}
            >
              ROUTINES365
            </h1>
            <p className="text-sm font-medium text-emerald-400">
              Stack your days. Change your life.
            </p>
          </header>
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            {renderAuthForm()}
          </section>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────
     WEB: inline auth form (no overlay — marketing page visible)
     ────────────────────────────────────── */
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left">
      {renderAuthForm()}
    </div>
  );
}
