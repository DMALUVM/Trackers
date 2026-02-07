/**
 * Haptic feedback for iOS PWA + Android.
 * Uses navigator.vibrate as primary, falls back silently.
 * Keep durations short — this is micro-feedback, not alerts.
 */

export function hapticLight() {
  try { navigator?.vibrate?.(10); } catch { /* silent */ }
}

export function hapticMedium() {
  try { navigator?.vibrate?.(18); } catch { /* silent */ }
}

export function hapticSuccess() {
  try { navigator?.vibrate?.([10, 30, 10]); } catch { /* silent */ }
}

export function hapticHeavy() {
  try { navigator?.vibrate?.([15, 40, 25]); } catch { /* silent */ }
}
