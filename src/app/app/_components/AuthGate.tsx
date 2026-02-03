"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        setHasSession(!!data.session);
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setHasSession(!!session);
      setReady(true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!hasSession) {
      // Preserve a return path so after login we can come back.
      const next = pathname ? `/?next=${encodeURIComponent(pathname)}` : "/";
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
