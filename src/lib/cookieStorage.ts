// Minimal cookie-backed storage for Supabase auth.
// iOS PWAs can be aggressive about clearing localStorage; cookies tend to persist.

function setCookie(name: string, value: string, maxAgeSec: number) {
  if (typeof document === "undefined") return;
  const safe = encodeURIComponent(value);
  document.cookie = `${name}=${safe}; Max-Age=${maxAgeSec}; Path=/; SameSite=Lax`;
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

export function cookieStorage(cookieName: string) {
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  return {
    getItem: (key: string) => {
      void key;
      return getCookie(cookieName);
    },
    setItem: (key: string, value: string) => {
      void key;
      setCookie(cookieName, value, maxAge);
    },
    removeItem: (key: string) => {
      void key;
      clearCookie(cookieName);
    },
  };
}
