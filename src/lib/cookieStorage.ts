// Minimal cookie-backed storage for Supabase auth.
// iOS PWAs can be aggressive about clearing localStorage; cookies tend to persist.

function setCookie(name: string, value: string, maxAgeSec: number) {
  if (typeof document === "undefined") return;
  const safe = encodeURIComponent(value);
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${safe}; Max-Age=${maxAgeSec}; Path=/; SameSite=Lax${secure}`;
}

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

export function cookieStorage(prefix: string) {
  const maxAge = 60 * 60 * 24 * 30; // 30 days

  const nameForKey = (key: string) => {
    // Use a stable prefix so Supabase can store multiple keys.
    // Keep cookie name reasonably short and safe.
    const safeKey = key.replace(/[^a-zA-Z0-9_\-:.]/g, "_");
    return `${prefix}.${safeKey}`;
  };

  return {
    getItem: (key: string) => {
      return getCookie(nameForKey(key));
    },
    setItem: (key: string, value: string) => {
      setCookie(nameForKey(key), value, maxAge);
    },
    removeItem: (key: string) => {
      clearCookie(nameForKey(key));
    },
  };
}
