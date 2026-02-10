/**
 * Haptic feedback via Capacitor's native Haptics plugin.
 * Uses the iOS Taptic Engine for real physical feedback.
 * Falls back silently on web / unsupported platforms.
 *
 * Requires: npm install @capacitor/haptics + npx cap sync ios
 */

import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

/** Subtle tap — checkbox toggles, navigation, minor interactions */
export async function hapticLight() {
  try { await Haptics.impact({ style: ImpactStyle.Light }); } catch { /* not native */ }
}

/** Medium tap — button presses, card selections */
export async function hapticMedium() {
  try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch { /* not native */ }
}

/** Strong tap — completions, milestone earned, important actions */
export async function hapticHeavy() {
  try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch { /* not native */ }
}

/** Success pattern — green day celebration, streak freeze confirmed */
export async function hapticSuccess() {
  try { await Haptics.notification({ type: NotificationType.Success }); } catch { /* not native */ }
}

/** Warning pattern — streak at risk */
export async function hapticWarning() {
  try { await Haptics.notification({ type: NotificationType.Warning }); } catch { /* not native */ }
}

/** Tiny selection tick — hold phase counting, picker scrolling */
export async function hapticSelection() {
  try { await Haptics.selectionStart(); await Haptics.selectionChanged(); await Haptics.selectionEnd(); } catch { /* not native */ }
}
