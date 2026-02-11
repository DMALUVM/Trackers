/**
 * App Store Rating Prompt
 *
 * Triggers SKStoreReviewController via Capacitor bridge at positive moments.
 * Apple throttles this to 3 prompts per 365 days regardless, so we add our
 * own cooldowns for good UX and to avoid annoying users.
 *
 * Trigger points (called from app code):
 *  - After a streak milestone (7, 14, 30 days)
 *  - After 7th green day
 *  - After completing a breathwork/movement session for the 3rd time
 *
 * Safety nets:
 *  - 30-day cooldown between our prompts (on top of Apple's limit)
 *  - Max 3 prompts total per year (resets each calendar year)
 *  - Per-trigger flags — once a specific trigger fires, it never fires again
 *  - Native iOS further limits to 3 actual displays per 365 days
 */

const LS_KEY = "routines365:ratingPrompt";

interface RatingState {
  /** Last time we showed (or attempted) the prompt — ISO string */
  lastPrompted: string | null;
  /** Number of times prompted this cycle */
  promptCount: number;
  /** Total green days tracked (for timing first prompt) */
  greenDayCount: number;
  /** Last dateKey we counted as a green day (prevents double-counting) */
  lastGreenDate: string | null;
  /** Per-trigger flags — once true, that trigger never fires again */
  prompted7: boolean;
  prompted14: boolean;
  prompted30: boolean;
  promptedGreen7: boolean;
  promptedModule3: boolean;
  /** Year the promptCount was last reset (auto-resets yearly) */
  resetYear: number;
}

function load(): RatingState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultState();
    const state: RatingState = { ...defaultState(), ...JSON.parse(raw) };
    // Auto-reset prompt count each calendar year (Apple resets their limit yearly too)
    const currentYear = new Date().getFullYear();
    if (state.resetYear < currentYear) {
      state.promptCount = 0;
      state.resetYear = currentYear;
      save(state);
    }
    return state;
  } catch {
    return defaultState();
  }
}

function defaultState(): RatingState {
  return {
    lastPrompted: null,
    promptCount: 0,
    greenDayCount: 0,
    lastGreenDate: null,
    prompted7: false,
    prompted14: false,
    prompted30: false,
    promptedGreen7: false,
    promptedModule3: false,
    resetYear: new Date().getFullYear(),
  };
}

function save(state: RatingState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {}
}

/** Minimum days between prompts (our own cooldown on top of Apple's) */
const MIN_DAYS_BETWEEN = 30;

function daysSinceLastPrompt(state: RatingState): number {
  if (!state.lastPrompted) return Infinity;
  const diff = Date.now() - new Date(state.lastPrompted).getTime();
  return diff / (1000 * 60 * 60 * 24);
}

function canPrompt(state: RatingState): boolean {
  if (state.promptCount >= 3) return false;
  if (daysSinceLastPrompt(state) < MIN_DAYS_BETWEEN) return false;
  return true;
}

/**
 * Show the native App Store review dialog via Capacitor bridge.
 *
 * @capacitor-community/app-review registers as "AppReview" in the
 * Capacitor plugin registry. We also check legacy names as fallbacks.
 */
function showNativePrompt(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cap = (window as any).Capacitor as Record<string, unknown> | undefined;
    if (!cap) return false;

    const plugins = cap.Plugins as
      | Record<string, Record<string, (...args: unknown[]) => void>>
      | undefined;

    // @capacitor-community/app-review → registers as "AppReview"
    if (plugins?.AppReview?.requestReview) {
      plugins.AppReview.requestReview();
      return true;
    }
    // Fallback: some plugins register as "AppRate"
    if (plugins?.AppRate?.requestReview) {
      plugins.AppRate.requestReview();
      return true;
    }
    // Fallback: "StoreReview"
    if (plugins?.StoreReview?.requestReview) {
      plugins.StoreReview.requestReview();
      return true;
    }

    // Last resort: webkit messageHandler (bare WKWebView without Capacitor)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wk = (window as any).webkit as Record<string, unknown> | undefined;
    const handlers = wk?.messageHandlers as
      | Record<string, { postMessage: (msg: unknown) => void }>
      | undefined;
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
export function ratingOnGreenDay(dateKey?: string) {
  const state = load();
  // Deduplicate: only count once per calendar day
  const today = dateKey || new Date().toISOString().slice(0, 10);
  if (state.lastGreenDate === today) return;
  state.lastGreenDate = today;
  state.greenDayCount++;
  save(state);
  if (state.greenDayCount === 7 && !state.promptedGreen7) {
    state.promptedGreen7 = true;
    save(state);
    attemptPrompt(state);
  }
}

/** Call after completing a breathwork/movement session. Prompts on 3rd completion. */
export function ratingOnModuleComplete() {
  const KEY = "routines365:ratingModuleCount";
  try {
    const count = (parseInt(localStorage.getItem(KEY) ?? "0", 10) || 0) + 1;
    localStorage.setItem(KEY, String(count));
    if (count === 3) {
      const state = load();
      if (!state.promptedModule3) {
        state.promptedModule3 = true;
        save(state);
        attemptPrompt(state);
      }
    }
  } catch {}
}
