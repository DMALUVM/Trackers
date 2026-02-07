import type { Session } from "@supabase/supabase-js";

// iOS PWAs can lose localStorage/session restoration. As a pragmatic fallback,
// mirror the Supabase session into cookies (non-HttpOnly) so we can restore.
// This is not as secure as httpOnly cookies, but improves UX dramatically.

const CK_AT = "r365_at";
const CK_RT = "r365_rt";
const CK_EXP = "r365_exp";

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

export function persistSessionToCookies(session: Session | null) {
  if (!session) {
    clearCookie(CK_AT);
    clearCookie(CK_RT);
    clearCookie(CK_EXP);
    return;
  }

  // Use refresh token lifetime-ish; at minimum keep it for 30 days.
  const maxAge = 60 * 60 * 24 * 30;
  setCookie(CK_AT, session.access_token, maxAge);
  setCookie(CK_RT, session.refresh_token, maxAge);
  setCookie(CK_EXP, String(session.expires_at ?? 0), maxAge);
}

/** Clear all session cookies — used during sign-out */
export function clearSessionCookies() {
  clearCookie(CK_AT);
  clearCookie(CK_RT);
  clearCookie(CK_EXP);
  // Also clear the session flag cookie and any legacy oversized storage cookies
  clearCookie("r365_sb.flag");
  clearCookie("r365_sb.r365_sb");
}

export function readSessionFromCookies(): {
  access_token: string;
  refresh_token: string;
  expires_at: number;
} | null {
  const at = getCookie(CK_AT);
  const rt = getCookie(CK_RT);
  const exp = getCookie(CK_EXP);
  if (!at || !rt) return null;
  const expires_at = exp ? Number(exp) : 0;
  return { access_token: at, refresh_token: rt, expires_at };
}
