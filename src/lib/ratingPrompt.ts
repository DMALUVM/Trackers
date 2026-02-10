/**
 * App Store Rating Prompt
 *
 * Triggers SKStoreReviewController via Capacitor bridge at positive moments.
 * Apple throttles this to 3 prompts per 365 days regardless, so we can
 * call it fairly freely — but we still add our own cooldowns for good UX.
 *
 * Trigger points (called from app code):
 *  - After a streak milestone (7, 14, 30 days)
 *  - After 7th day of app usage
 *  - After completing a breathwork session for the 3rd time
 *  - After marking all core habits done (only once per week)
 */

const LS_KEY = "routines365:ratingPrompt";

interface RatingState {
  /** Last time we showed (or attempted) the prompt — ISO string */
  lastPrompted: string | null;
  /** Number of times prompted */
  promptCount: number;
  /** Total app opens / green days (for timing first prompt) */
  greenDayCount: number;
  /** Has ever rated (user dismissed or completed — we can't tell) */
  prompted7: boolean;
  prompted14: boolean;
  prompted30: boolean;
}

function load(): RatingState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : defaultState();
  } catch {
    return defaultState();
  }
}

function defaultState(): RatingState {
  return {
    lastPrompted: null,
    promptCount: 0,
    greenDayCount: 0,
    prompted7: false,
    prompted14: false,
    prompted30: false,
  };
}

function save(state: RatingState) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
}

/** Minimum days between prompts (our own cooldown on top of Apple's) */
const MIN_DAYS_BETWEEN = 30;

function daysSinceLastPrompt(state: RatingState): number {
  if (!state.lastPrompted) return Infinity;
  const diff = Date.now() - new Date(state.lastPrompted).getTime();
  return diff / (1000 * 60 * 60 * 24);
}

function canPrompt(state: RatingState): boolean {
  // Max 3 prompts total (matches Apple's yearly limit)
  if (state.promptCount >= 3) return false;
  // Respect cooldown
  if (daysSinceLastPrompt(state) < MIN_DAYS_BETWEEN) return false;
  return true;
}

/** Show the native App Store review dialog */
function showNativePrompt(): boolean {
  try {
    // Capacitor bridge to SKStoreReviewController
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cap = (window as any).Capacitor as Record<string, unknown> | undefined;
    if (!cap) return false;
    const plugins = cap.Plugins as Record<string, Record<string, (...args: unknown[]) => void>> | undefined;
    // Try AppRate plugin first
    if (plugins?.AppRate?.requestReview) {
      plugins.AppRate.requestReview();
      return true;
    }
    // Try direct StoreReview plugin
    if (plugins?.StoreReview?.requestReview) {
      plugins.StoreReview.requestReview();
      return true;
    }
    // Fallback: webkit messageHandler (works in WKWebView)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wk = (window as any).webkit as Record<string, unknown> | undefined;
    const handlers = wk?.messageHandlers as Record<string, { postMessage: (msg: unknown) => void }> | undefined;
    if (handlers?.requestReview) {
      handlers.requestReview.postMessage({});
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function attemptPrompt(state: RatingState): boolean {
  if (!canPrompt(state)) return false;
  const shown = showNativePrompt();
  if (shown) {
    state.lastPrompted = new Date().toISOString();
    state.promptCount++;
    save(state);
  }
  return shown;
}

// ── Public API ──

/** Call when user hits a streak milestone */
export function ratingOnStreakMilestone(streak: number) {
  const state = load();
  if (streak === 7 && !state.prompted7) {
    state.prompted7 = true;
    save(state);
    attemptPrompt(state);
  } else if (streak === 14 && !state.prompted14) {
    state.prompted14 = true;
    save(state);
    attemptPrompt(state);
  } else if (streak === 30 && !state.prompted30) {
    state.prompted30 = true;
    save(state);
    attemptPrompt(state);
  }
}

/** Call when user completes all core habits (green day). Prompts after 7th green day. */
export function ratingOnGreenDay() {
  const state = load();
  state.greenDayCount++;
  save(state);
  // Prompt on 7th green day (user is engaged and happy)
  if (state.greenDayCount === 7) {
    attemptPrompt(state);
  }
}

/** Call after completing a breathwork/movement session. Prompts on 3rd completion. */
export function ratingOnModuleComplete() {
  // Use a separate counter
  const KEY = "routines365:ratingModuleCount";
  try {
    const count = (parseInt(localStorage.getItem(KEY) ?? "0", 10) || 0) + 1;
    localStorage.setItem(KEY, String(count));
    if (count === 3) {
      const state = load();
      attemptPrompt(state);
    }
  } catch {}
}
