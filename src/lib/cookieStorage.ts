// Hybrid storage for Supabase auth.
// Primary: localStorage (5 MB limit — more than enough for session tokens).
// Secondary: sets a tiny flag cookie ("r365_sb.flag=1") so page.tsx can
// synchronously detect a returning user before JS hydrates.
//
// iOS PWAs occasionally clear localStorage; the separate backup cookies
// (r365_at / r365_rt in sessionCookie.ts) handle that recovery path.
// We no longer store the full session JSON in a cookie — it routinely
// exceeds Chrome's 4 KB-per-cookie limit and gets silently dropped,
// which caused redirect loops on Chrome.

const FLAG_COOKIE = "r365_sb.flag";

function setFlagCookie(present: boolean) {
  if (typeof document === "undefined") return;
  if (present) {
    const secure =
      typeof location !== "undefined" && location.protocol === "https:"
        ? "; Secure"
        : "";
    document.cookie = `${FLAG_COOKIE}=1; Max-Age=${60 * 60 * 24 * 30}; Path=/; SameSite=Lax${secure}`;
  } else {
    document.cookie = `${FLAG_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
  }
}

export function cookieStorage(_prefix: string) {
  const lsKey = (key: string) => key;

  return {
    getItem: (key: string): string | null => {
      try {
        return localStorage.getItem(lsKey(key));
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(lsKey(key), value);
      } catch {
        /* quota exceeded — rare, ignore */
      }
      // Keep the tiny flag cookie in sync so hasSessionCookie() works.
      setFlagCookie(true);
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(lsKey(key));
      } catch {
        /* ignore */
      }
      setFlagCookie(false);
    },
  };
}
