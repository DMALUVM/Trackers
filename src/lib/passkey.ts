function b64url(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  const b64 = btoa(str);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomChallenge(len = 32) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return bytes;
}

const LS_ENABLED = "routines365:passkeyEnabled";
const LS_UNLOCK_UNTIL = "routines365:passkeyUnlockUntil";

export function isPasskeyEnabled() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LS_ENABLED) === "1";
}

export function clearPasskey() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LS_ENABLED);
  localStorage.removeItem(LS_UNLOCK_UNTIL);
}

export function setPasskeyEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_ENABLED, enabled ? "1" : "0");
}

export function isUnlockValid() {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(LS_UNLOCK_UNTIL);
  const until = raw ? Number(raw) : 0;
  return Number.isFinite(until) && Date.now() < until;
}

export function setUnlockValidFor(ms: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_UNLOCK_UNTIL, String(Date.now() + ms));
}

/**
 * Registers a device passkey. This triggers Face ID / Touch ID on iPhone.
 *
 * IMPORTANT: This is used as an app-unlock mechanism (like Face ID to open the app),
 * not a replacement for Supabase authentication (which still uses magic link).
 */
export async function registerPasskey(opts: { email: string }) {
  if (!window.PublicKeyCredential) {
    throw new Error("Passkeys are not supported on this device/browser.");
  }

  const rpId = window.location.hostname;
  const challenge = randomChallenge();

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Routines365", id: rpId },
      user: {
        id: randomChallenge(32),
        name: opts.email,
        displayName: opts.email,
      },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ES256
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
      },
      timeout: 60_000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("Passkey registration cancelled.");

  // We don't need to store the credential server-side for local unlock.
  // But we record that the user enabled it so we can show the unlock gate.
  setPasskeyEnabled(true);

  return {
    credentialId: b64url(credential.rawId),
  };
}

/**
 * Prompts Face ID / Touch ID to unlock the app.
 */
export async function unlockWithPasskey() {
  if (!window.PublicKeyCredential) {
    throw new Error("Passkeys are not supported on this device/browser.");
  }

  const rpId = window.location.hostname;
  const challenge = randomChallenge();

  // For discoverable credentials we can omit allowCredentials.
  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId,
      userVerification: "required",
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;

  if (!assertion) throw new Error("Unlock cancelled.");

  // Treat successful WebAuthn UX as "unlocked" for a period.
  setUnlockValidFor(1000 * 60 * 60 * 12); // 12 hours
  return { ok: true };
}
