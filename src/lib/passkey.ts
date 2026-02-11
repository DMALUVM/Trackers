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

// ── Native biometric bridge ──

function getBiometricPlugin(): Record<string, (...args: unknown[]) => Promise<unknown>> | null {
  if (typeof window === "undefined") return null;
  // @ts-expect-error - Capacitor global
  const cap = window.Capacitor;
  if (!cap) return null;
  try {
    return cap.Plugins?.BiometricPlugin ?? cap.registerPlugin?.("BiometricPlugin") ?? null;
  } catch {
    return null;
  }
}

function isNative(): boolean {
  if (typeof window === "undefined") return false;
  // @ts-expect-error - Capacitor global
  return !!window.Capacitor;
}

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
 * Check what biometric type is available.
 * Returns 'faceID', 'touchID', or null.
 */
export async function getBiometryType(): Promise<string | null> {
  const plugin = getBiometricPlugin();
  if (plugin) {
    try {
      const result = await plugin.isAvailable() as { available: boolean; biometryType: string };
      return result.available ? result.biometryType : null;
    } catch {
      return null;
    }
  }
  // Web fallback: check WebAuthn support
  if (typeof window !== "undefined" && window.PublicKeyCredential) return "passkey";
  return null;
}

/**
 * Registers biometric lock. On native, uses Face ID/Touch ID directly.
 * On web, falls back to WebAuthn passkeys.
 */
export async function registerPasskey(opts: { email: string }) {
  const plugin = getBiometricPlugin();

  // Native path: just verify biometric works, then enable
  if (plugin) {
    const check = await plugin.isAvailable() as { available: boolean };
    if (!check.available) {
      throw new Error("Biometric authentication is not available on this device.");
    }
    const result = await plugin.authenticate({ reason: "Enable Face ID for Routines365" } as unknown) as { success: boolean; error?: string };
    if (!result.success) {
      throw new Error(result.error ?? "Authentication failed.");
    }
    setPasskeyEnabled(true);
    return { credentialId: "native-biometric" };
  }

  // Web fallback: WebAuthn
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
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
      },
      timeout: 60_000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("Passkey registration cancelled.");
  setPasskeyEnabled(true);
  return { credentialId: b64url(credential.rawId) };
}

/**
 * Prompts Face ID / Touch ID to unlock the app.
 * On native, uses LAContext. On web, falls back to WebAuthn.
 */
export async function unlockWithPasskey() {
  const plugin = getBiometricPlugin();

  // Native path
  if (plugin) {
    const result = await plugin.authenticate({ reason: "Unlock Routines365" } as unknown) as { success: boolean; error?: string };
    if (!result.success) {
      throw new Error(result.error ?? "Unlock cancelled.");
    }
    setUnlockValidFor(1000 * 60 * 60 * 12);
    return { ok: true };
  }

  // Web fallback
  if (!window.PublicKeyCredential) {
    throw new Error("Passkeys are not supported on this device/browser.");
  }

  const rpId = window.location.hostname;
  const challenge = randomChallenge();

  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId,
      userVerification: "required",
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;

  if (!assertion) throw new Error("Unlock cancelled.");
  setUnlockValidFor(1000 * 60 * 60 * 12);
  return { ok: true };
}
