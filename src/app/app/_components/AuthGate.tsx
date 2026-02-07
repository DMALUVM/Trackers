"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { BrandIcon } from "@/app/app/_components/BrandIcon";
import { persistSessionToCookies, readSessionFromCookies } from "@/lib/sessionCookie";

/**
 * Ensures /app routes never render in a "half-auth" state.
 *
 * On iOS PWAs, session restoration can be async. Without this gate,
 * pages could briefly see "no user" and force re-auth.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const init = async () => {
      try {
        let { data } = await supabase.auth.getSession();

        // iOS Safari/PWA timing: retry with increasing delays
        if (!data.session) {
          for (const delay of [0, 250, 800]) {
            if (delay) await sleep(delay);
            try { await supabase.auth.refreshSession(); } catch { /* ignore */ }
            data = (await supabase.auth.getSession()).data;
            if (data.session) break;
          }
        }

        // Fallback: restore from cookies if localStorage was cleared
        if (!data.session) {
          const cookie = readSessionFromCookies();
          if (cookie) {
            try {
              await supabase.auth.setSession({
                access_token: cookie.access_token,
                refresh_token: cookie.refresh_token,
              });
              data = (await supabase.auth.getSession()).data;
            } catch { /* ignore */ }
          }
        }

        persistSessionToCookies(data.session);
        if (cancelled) return;
        setHasSession(!!data.session);
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void init();

    // Refresh on foreground
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void supabase.auth.refreshSession().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);

    // Periodic refresh for long sessions
    const interval = window.setInterval(() => {
      void supabase.auth.refreshSession().catch(() => {});
    }, 5 * 60 * 1000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      persistSessionToCookies(session);
      setHasSession(!!session);
      setReady(true);
    });

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  // Redirect to login if no session
  useEffect(() => {
    if (!ready) return;
    if (!hasSession) {
      const fullPath = typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : pathname ?? "/";
      router.replace(`/?next=${encodeURIComponent(fullPath)}`);
    }
  }, [ready, hasSession, router, pathname]);

  // ── Branded splash while loading ──
  if (!ready) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="relative">
          {/* Subtle glow */}
          <div className="absolute inset-0 rounded-2xl animate-pulse"
            style={{ background: "var(--accent-green-soft)", filter: "blur(20px)", transform: "scale(1.5)" }} />
          <div className="relative">
            <BrandIcon size={64} />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-full animate-pulse"
              style={{
                width: 6, height: 6,
                background: "var(--text-faint)",
                animationDelay: `${i * 0.15}s`,
              }} />
          ))}
        </div>
      </div>
    );
  }

  if (!hasSession) return null; // Redirecting

  return <>{children}</>;
}
