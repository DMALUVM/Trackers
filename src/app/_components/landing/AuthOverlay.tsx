"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { BrandIcon } from "@/app/app/_components/BrandIcon";

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
 * Lightweight overlay that covers the marketing page while checking auth.
 * - Shows splash screen during auth check
 * - Redirects signed-in users to /app/today
 * - Returns null when signed out (revealing the server-rendered marketing page)
 *
 * The native auth flow is handled by AuthBlock in the auth section.
 */
export function AuthOverlay() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("checking");

  useEffect(() => {
    if (!hasSessionCookie()) {
      setAuthState("signed-out");
      return;
    }
    let cancelled = false;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const check = async () => {
      try {
        let { data } = await supabase.auth.getSession();
        if (!data.session) {
          for (const delay of [0, 250, 800]) {
            if (delay) await sleep(delay);
            try { await supabase.auth.refreshSession(); } catch {}
            data = (await supabase.auth.getSession()).data;
            if (data.session) break;
          }
        }
        if (cancelled) return;
        setAuthState(data.session ? "signed-in" : "signed-out");
      } catch {
        if (!cancelled) setAuthState("signed-out");
      }
    };
    void check();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (authState === "signed-in") router.replace("/app/today");
  }, [authState, router]);

  // Signed out → return nothing. Marketing page shows on web, AuthBlock handles native.
  if (authState === "signed-out") return null;

  // Checking auth or signed in (redirecting) or native → show splash overlay
  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      aria-hidden="true"
    >
      <div className="text-center space-y-5 animate-fade-in">
        <div className="mx-auto" style={{ width: 72 }}>
          <BrandIcon size={72} />
        </div>
        <p
          className="text-xl font-semibold uppercase text-white"
          style={{ letterSpacing: "0.06em" }}
        >
          ROUTINES365
        </p>
        <p className="text-xs text-neutral-500">
          Stack your days. Change your life.
        </p>
        <div className="flex items-center justify-center gap-2">
          {[0, 0.15, 0.3].map((d) => (
            <div
              key={d}
              className="h-1.5 w-1.5 rounded-full bg-white/40 animate-pulse"
              style={{ animationDelay: `${d}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
