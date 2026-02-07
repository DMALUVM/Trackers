"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { persistSessionToCookies, readSessionFromCookies } from "@/lib/sessionCookie";

/**
 * Ensures the /app routes never render in a "half-auth" state.
 *
 * On some devices (notably iOS PWAs), session restoration can be slightly async.
 * If pages call Supabase immediately, they can briefly see "no user" and force
 * re-auth, which feels like the user is being logged out.
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
        // First check: do we already have a session in storage?
        let { data } = await supabase.auth.getSession();

        // iOS Safari/PWA can be flaky about timing; also access tokens can expire.
        // If we have no session, attempt a few quiet refreshes before redirecting.
        if (!data.session) {
          for (const delay of [0, 250, 800]) {
            if (delay) await sleep(delay);
            try {
              await supabase.auth.refreshSession();
            } catch {
              // ignore
            }
            data = (await supabase.auth.getSession()).data;
            if (data.session) break;
          }
        }

        // Fallback: restore from cookies if local storage was cleared (common on iOS PWA).
        if (!data.session) {
          const cookie = readSessionFromCookies();
          if (cookie) {
            try {
              await supabase.auth.setSession({
                access_token: cookie.access_token,
                refresh_token: cookie.refresh_token,
              });
              data = (await supabase.auth.getSession()).data;
            } catch {
              // ignore
            }
          }
        }

        // Keep cookies in sync when we do have a session.
        persistSessionToCookies(data.session);

        if (cancelled) return;
        setHasSession(!!data.session);
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void init();

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      // When the app is foregrounded, try to refresh quietly.
      void supabase.auth.refreshSession().catch(() => {});
    };

    document.addEventListener("visibilitychange", onVisible);

    // Extra safety for iOS PWAs: periodically refresh so users don't get "surprise" logouts.
    const interval = window.setInterval(() => {
      void supabase.auth.refreshSession().catch(() => {});
    }, 5 * 60 * 1000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      // Mirror into cookies so iOS PWAs can restore if local storage is wiped.
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

  useEffect(() => {
    if (!ready) return;
    if (!hasSession) {
      // Preserve a return path so after login we can come back.
      // Include query string if present.
      const fullPath =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : pathname ?? "/";
      const next = `/?next=${encodeURIComponent(fullPath)}`;
      router.replace(next);
    }
  }, [ready, hasSession, router, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-neutral-400">Loading…</p>
      </div>
    );
  }

  if (!hasSession) {
    // We are redirecting.
    return null;
  }

  return <>{children}</>;
}
