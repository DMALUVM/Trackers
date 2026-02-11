// ===========================================================================
// MILESTONE & ACHIEVEMENT SYSTEM
// ===========================================================================
// Behavioral psychology: Variable-ratio reinforcement. Not every day is the
// same — special moments at specific thresholds create dopamine spikes that
// keep people coming back. (Duolingo, Apple Fitness rings, Wordle streaks.)
// ===========================================================================

export interface Milestone {
  id: string;
  emoji: string;
  title: string;
  message: string;
  /** The threshold that triggers this milestone */
  threshold: number;
  type: "streak" | "green_total" | "personal_best";
}

// ── Streak milestones ──
export const STREAK_MILESTONES: Milestone[] = [
  { id: "streak-3",   emoji: "🔥", title: "On Fire",        message: "3 green days in a row. The habit is forming.", threshold: 3, type: "streak" },
  { id: "streak-7",   emoji: "⚡", title: "One Week",       message: "A full week of consistency. That's rare.", threshold: 7, type: "streak" },
  { id: "streak-14",  emoji: "💪", title: "Two Weeks",      message: "14 days. Research says this is where habits start to stick.", threshold: 14, type: "streak" },
  { id: "streak-21",  emoji: "🧠", title: "Three Weeks",    message: "21 days. Your brain is rewiring. This is who you are now.", threshold: 21, type: "streak" },
  { id: "streak-30",  emoji: "🏆", title: "One Month",      message: "30 consecutive green days. Most people never get here.", threshold: 30, type: "streak" },
  { id: "streak-50",  emoji: "⭐", title: "Fifty Days",     message: "50 days. You've built something most people only talk about.", threshold: 50, type: "streak" },
  { id: "streak-75",  emoji: "💎", title: "Seventy-Five",   message: "75 days. Discipline is just who you are at this point.", threshold: 75, type: "streak" },
  { id: "streak-100", emoji: "👑", title: "The Hundred",    message: "100 consecutive days. You're in the top 1% of habit builders.", threshold: 100, type: "streak" },
  { id: "streak-150", emoji: "🌟", title: "150 Days",       message: "Half a year of consistency. Remarkable.", threshold: 150, type: "streak" },
  { id: "streak-200", emoji: "🔱", title: "Two Hundred",    message: "200 days. This isn't a streak anymore — it's a lifestyle.", threshold: 200, type: "streak" },
  { id: "streak-365", emoji: "🎆", title: "One Full Year",  message: "365 green days in a row. You did the impossible.", threshold: 365, type: "streak" },
];

// ── Total green day milestones ──
export const GREEN_TOTAL_MILESTONES: Milestone[] = [
  { id: "green-1",    emoji: "🌱", title: "First Green Day", message: "Your journey started today. Remember this moment.", threshold: 1, type: "green_total" },
  { id: "green-10",   emoji: "🌿", title: "Ten Green Days",  message: "10 green days under your belt. You're building proof.", threshold: 10, type: "green_total" },
  { id: "green-25",   emoji: "🌳", title: "Twenty-Five",     message: "25 green days. The compound effect is working.", threshold: 25, type: "green_total" },
  { id: "green-50",   emoji: "🏅", title: "Fifty Green",     message: "50 days of showing up. That's character.", threshold: 50, type: "green_total" },
  { id: "green-100",  emoji: "💯", title: "The Century",     message: "100 green days total. You've earned every single one.", threshold: 100, type: "green_total" },
  { id: "green-200",  emoji: "🏛️",  title: "Two Hundred",    message: "200 green days. You've built a monument to consistency.", threshold: 200, type: "green_total" },
  { id: "green-365",  emoji: "🎯", title: "Full Year",       message: "365 total green days. A year of showing up.", threshold: 365, type: "green_total" },
];

const LS_KEY = "routines365:milestones:achieved";
const LS_PENDING = "routines365:milestones:pending";
const LS_QUEUE = "routines365:milestones:queue";

/** Get set of already-achieved milestone IDs */
export function getAchievedMilestones(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveAchieved(ids: Set<string>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify([...ids])); } catch { /* ignore */ }
}

/** Get pending milestone to show (and clear it) */
export function popPendingMilestone(): Milestone | null {
  try {
    // First check single pending (legacy + primary)
    const raw = localStorage.getItem(LS_PENDING);
    if (raw) {
      localStorage.removeItem(LS_PENDING);
      return JSON.parse(raw) as Milestone;
    }
    // Then check queue for additional milestones
    const qRaw = localStorage.getItem(LS_QUEUE);
    if (qRaw) {
      const queue: Milestone[] = JSON.parse(qRaw);
      if (queue.length > 0) {
        const next = queue.shift()!;
        if (queue.length > 0) {
          localStorage.setItem(LS_QUEUE, JSON.stringify(queue));
        } else {
          localStorage.removeItem(LS_QUEUE);
        }
        return next;
      }
      localStorage.removeItem(LS_QUEUE);
    }
    return null;
  } catch { return null; }
}

/**
 * Check for newly earned milestones. Call after any green day.
 * 
 * Returns the MOST IMPORTANT new milestone (highest streak > highest green_total > PB).
 * Any additional new milestones are queued for later display.
 * 
 * Priority order:
 *   1. Streak milestones (highest threshold first)
 *   2. Green total milestones (highest threshold first)  
 *   3. Personal best
 */
export function checkMilestones(opts: {
  currentStreak: number;
  bestStreak: number;
  totalGreenDays: number;
  previousBestStreak: number;
}): Milestone | null {
  const achieved = getAchievedMilestones();
  const newlyEarned: Milestone[] = [];

  // Collect ALL newly earned streak milestones
  for (const m of STREAK_MILESTONES) {
    if (opts.currentStreak >= m.threshold && !achieved.has(m.id)) {
      achieved.add(m.id);
      newlyEarned.push(m);
    }
  }

  // Collect ALL newly earned green total milestones
  for (const m of GREEN_TOTAL_MILESTONES) {
    if (opts.totalGreenDays >= m.threshold && !achieved.has(m.id)) {
      achieved.add(m.id);
      newlyEarned.push(m);
    }
  }

  // Personal best detection
  if (opts.currentStreak > opts.previousBestStreak && opts.currentStreak > 1) {
    const pbId = `pb-${opts.currentStreak}`;
    if (!achieved.has(pbId)) {
      achieved.add(pbId);
      // Only add PB if it's not already a streak milestone threshold
      const isAlsoStreakMilestone = STREAK_MILESTONES.some(
        (m) => m.threshold === opts.currentStreak
      );
      if (!isAlsoStreakMilestone) {
        newlyEarned.push({
          id: pbId,
          emoji: "🏆",
          title: "New Personal Best!",
          message: `${opts.currentStreak}-day streak. You just beat your previous record of ${opts.previousBestStreak}.`,
          threshold: opts.currentStreak,
          type: "personal_best",
        });
      }
    }
  }

  saveAchieved(achieved);

  if (newlyEarned.length === 0) return null;

  // ── Priority sort: streak (desc) → green_total (desc) → personal_best ──
  const typePriority = { streak: 0, green_total: 1, personal_best: 2 };
  newlyEarned.sort((a, b) => {
    const tp = typePriority[a.type] - typePriority[b.type];
    if (tp !== 0) return tp;
    return b.threshold - a.threshold; // Higher threshold = more important
  });

  // Show the top one immediately, queue the rest
  const primary = newlyEarned[0];
  const rest = newlyEarned.slice(1);

  // Store primary as pending
  try { localStorage.setItem(LS_PENDING, JSON.stringify(primary)); } catch { /* ignore */ }

  // Queue additional milestones for later display
  if (rest.length > 0) {
    try {
      const existingQueue: Milestone[] = (() => {
        try { const r = localStorage.getItem(LS_QUEUE); return r ? JSON.parse(r) : []; } catch { return []; }
      })();
      localStorage.setItem(LS_QUEUE, JSON.stringify([...existingQueue, ...rest]));
    } catch { /* ignore */ }
  }

  return primary;
}

/** Get all earned milestones for display in a trophy case */
export function getAllEarnedMilestones(): Milestone[] {
  const achieved = getAchievedMilestones();
  const all = [...STREAK_MILESTONES, ...GREEN_TOTAL_MILESTONES];
  return all.filter((m) => achieved.has(m.id));
}

/** Get next upcoming milestone for motivation */
export function getNextMilestone(currentStreak: number, totalGreenDays: number): {
  streakNext: Milestone | null;
  greenNext: Milestone | null;
} {
  const streakNext = STREAK_MILESTONES.find((m) => m.threshold > currentStreak) ?? null;
  const greenNext = GREEN_TOTAL_MILESTONES.find((m) => m.threshold > totalGreenDays) ?? null;
  return { streakNext, greenNext };
}
