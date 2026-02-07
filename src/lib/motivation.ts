// ===========================================================================
// DYNAMIC MOTIVATION ENGINE
// ===========================================================================
// Psychology: Messages that feel PERSONAL are 3x more effective than generic
// ones. This engine produces context-aware copy based on time, streak, trend,
// and where you are in today's progress — like a coach who knows you.
//
// Key principles:
// - Loss aversion: "Don't break a 7-day streak" > "Start a new streak"
// - Identity: "You're consistent" > "You did 5 days"
// - Fresh start: Mondays and 1st of month = opportunity framing
// - Comeback: Never shame. Always warmth after missed days.
// - Variable reward: Rotate messages so it never feels stale.
// ===========================================================================

type TimeOfDay = "early" | "morning" | "afternoon" | "evening" | "night";

function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h < 5) return "night";
  if (h < 9) return "early";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

function isMonday() { return new Date().getDay() === 1; }
function isFirstOfMonth() { return new Date().getDate() === 1; }
function isFriday() { return new Date().getDay() === 5; }
function isWeekend() { return [0, 6].includes(new Date().getDay()); }

/** Deterministic daily "random" — same message all day, changes tomorrow */
function dailySeed(): number {
  const d = new Date();
  return (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) % 1000;
}
function pick<T>(arr: readonly T[]): T {
  return arr[dailySeed() % arr.length];
}

// ── Message banks ──

const MORNING_FRESH = [
  "New day, clean slate. What will you build today?",
  "The best version of your day starts now.",
  "Small wins compound. Let's get the first one.",
  "Today only happens once. Make it green.",
  "You showed up. That's already ahead of most people.",
] as const;

const STREAK_PROTECT = [
  "Your streak is alive. Keep it breathing.",
  "Every green day makes the next one easier.",
  "Consistency beats intensity. Stay the course.",
  "Your future self will thank you for today.",
  "The chain is only as strong as today's link.",
] as const;

const STREAK_CELEBRATE = [
  "Look at that streak. You're different now.",
  "This isn't luck. This is who you're becoming.",
  "The compound effect of consistency is working.",
  "Discipline is choosing what you want most over what you want now.",
  "You're proving something to yourself every day.",
] as const;

const COMEBACK_WARM = [
  "Welcome back. No judgment — just a fresh start.",
  "Streaks end. What matters is you're here again.",
  "The best time to restart was yesterday. The second best is now.",
  "Missing a day doesn't erase your progress. Quitting does.",
  "You came back. That takes more strength than you think.",
] as const;

const ALMOST_DONE = [
  "So close. One more and you're green.",
  "Almost there. Don't leave it incomplete.",
  "One habit between you and a green day.",
  "Finish what you started. You're right there.",
  "The last one is the one that counts most.",
] as const;

const GREEN_DAY = [
  "Green day locked. You earned this.",
  "All core done. The rest is just bonus.",
  "That's the kind of day that builds a life.",
  "Another brick in the wall. Strong work.",
  "Green. Clean. Done.",
] as const;

const WEEKEND_CHILL = [
  "Weekend pace. Show up for yourself, even today.",
  "Weekends test consistency. You already know what to do.",
  "No off days from being the person you want to be.",
] as const;

const MONDAY_ENERGY = [
  "Monday. Fresh week. Let's set the tone.",
  "New week, new chance to build momentum.",
  "The whole week is ahead. Start strong.",
] as const;

const MONTH_START = [
  "New month. New page. Same commitment.",
  "First of the month — perfect time to raise the bar.",
  "A fresh month starts with a green day.",
] as const;

const EVENING_NUDGE = [
  "Still time to finish today. Don't let it slip.",
  "Evening check-in. How are you tracking?",
  "The day's not over. You can still make it green.",
] as const;

const NIGHT_WRAP = [
  "Wrapping up? Check off what you got done.",
  "End the day knowing where you stand.",
  "Log it before you sleep. Tomorrow-you will be glad.",
] as const;

// ── Main engine ──

export interface MotivationContext {
  currentStreak: number;
  bestStreak: number;
  coreDone: number;
  coreTotal: number;
  allCoreDone: boolean;
  /** How many days since last green day (0 = today is green or in progress) */
  daysSinceLastGreen: number;
  /** Green days this week so far */
  greenThisWeek: number;
  /** Green days last week */
  greenLastWeek: number;
}

export interface MotivationMessage {
  text: string;
  type: "greeting" | "nudge" | "celebrate" | "comeback" | "milestone_tease";
  intensity: "low" | "medium" | "high";
}

export function getMotivation(ctx: MotivationContext): MotivationMessage {
  const time = getTimeOfDay();

  // ── Priority 1: Green day celebration ──
  if (ctx.allCoreDone) {
    return { text: pick(GREEN_DAY), type: "celebrate", intensity: "high" };
  }

  // ── Priority 2: Almost done (1 left) — urgency ──
  if (ctx.coreTotal > 0 && ctx.coreTotal - ctx.coreDone === 1) {
    return { text: pick(ALMOST_DONE), type: "nudge", intensity: "high" };
  }

  // ── Priority 3: Comeback after missed days ──
  if (ctx.daysSinceLastGreen > 2 && ctx.currentStreak === 0) {
    return { text: pick(COMEBACK_WARM), type: "comeback", intensity: "medium" };
  }

  // ── Priority 4: Streak protection (evening, not done yet) ──
  if (ctx.currentStreak >= 3 && (time === "evening" || time === "night") && ctx.coreDone < ctx.coreTotal) {
    const msg = ctx.currentStreak >= 7
      ? `${ctx.currentStreak}-day streak on the line. Finish strong.`
      : pick(STREAK_PROTECT);
    return { text: msg, type: "nudge", intensity: "high" };
  }

  // ── Priority 5: Fresh start moments ──
  if (isFirstOfMonth() && ctx.coreDone === 0) {
    return { text: pick(MONTH_START), type: "greeting", intensity: "medium" };
  }
  if (isMonday() && ctx.coreDone === 0) {
    return { text: pick(MONDAY_ENERGY), type: "greeting", intensity: "medium" };
  }

  // ── Priority 6: Active streak celebration ──
  if (ctx.currentStreak >= 7 && (time === "early" || time === "morning")) {
    return { text: pick(STREAK_CELEBRATE), type: "celebrate", intensity: "medium" };
  }

  // ── Priority 7: Weekend awareness ──
  if (isWeekend() && ctx.coreDone === 0) {
    return { text: pick(WEEKEND_CHILL), type: "nudge", intensity: "low" };
  }

  // ── Priority 8: Time-based nudges ──
  if (time === "evening" && ctx.coreDone < ctx.coreTotal) {
    return { text: pick(EVENING_NUDGE), type: "nudge", intensity: "medium" };
  }
  if (time === "night" && ctx.coreDone < ctx.coreTotal) {
    return { text: pick(NIGHT_WRAP), type: "nudge", intensity: "low" };
  }

  // ── Priority 9: Trend awareness ──
  if (ctx.greenThisWeek > ctx.greenLastWeek && ctx.greenThisWeek >= 3) {
    return { text: "Trending up this week. Keep the momentum.", type: "celebrate", intensity: "low" };
  }

  // ── Default: Morning motivation ──
  return { text: pick(MORNING_FRESH), type: "greeting", intensity: "low" };
}

/**
 * Streak-at-risk message for the score card area.
 * Only shows in the evening/night when streak could be lost.
 */
export function getStreakRiskMessage(streak: number, allDone: boolean, coreDone: number, coreTotal: number): string | null {
  if (allDone || streak < 2) return null;
  const time = getTimeOfDay();
  if (time !== "evening" && time !== "night") return null;
  if (coreDone === coreTotal) return null;

  const left = coreTotal - coreDone;
  if (streak >= 14) return `⚠️ ${streak}-day streak at risk — ${left} core habit${left > 1 ? "s" : ""} left`;
  if (streak >= 7) return `${left} left to protect your ${streak}-day streak`;
  if (streak >= 3) return `Don't break the chain — ${left} to go`;
  return null;
}

/**
 * Weekly trend indicator
 */
export function getWeeklyTrend(greenThisWeek: number, greenLastWeek: number): {
  label: string;
  emoji: string;
  direction: "up" | "same" | "down";
} {
  if (greenThisWeek > greenLastWeek) return { label: "Trending up", emoji: "📈", direction: "up" };
  if (greenThisWeek === greenLastWeek) return { label: "Holding steady", emoji: "➡️", direction: "same" };
  return { label: "Room to grow", emoji: "💪", direction: "down" };
}
