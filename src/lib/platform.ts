/**
 * Platform detection utilities.
 * Use these to adapt behavior for native vs. web.
 */

/** Returns true when running inside Capacitor native shell */
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  // @ts-expect-error - Capacitor global injected by native shell
  return !!window.Capacitor;
}

/** Returns true when running as installed PWA (home screen) */
export function isPWA(): boolean {
  if (typeof window === "undefined") return false;
  // @ts-expect-error - nonstandard Safari property
  return !!navigator.standalone || window.matchMedia?.("(display-mode: standalone)")?.matches;
}

/** Returns true for mobile browser or native */
export function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/** Returns "native" | "pwa" | "browser" */
export function getPlatform(): "native" | "pwa" | "browser" {
  if (isNativeApp()) return "native";
  if (isPWA()) return "pwa";
  return "browser";
}
