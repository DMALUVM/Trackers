"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { MoreHorizontal, Zap, Trophy, Wind, Dumbbell, Brain } from "lucide-react";

import { useToday, useRoutineDay, usePersist, useStreaks } from "@/lib/hooks";
import {
  ProgressRing,
  WeekStrip,
  RoutineCheckItem,
  TodayPageSkeleton,
  Toast,
  BottomSheet,
  ConfettiBurst,
  MilestoneModal,
  MotivationBanner,
  NextMilestoneTeaser,
  ComebackBanner,
  GettingStartedTips,
  SetupPrompts,
  ReminderSheet,
} from "@/app/app/_components/ui";
import { MetricSheet, type MetricKind } from "@/app/app/_components/MetricSheet";
import { QuestsCard } from "@/app/app/_components/QuestsCard";
import { WaterTracker } from "@/app/app/_components/WaterTracker";
import { SNOOZE_DURATION_MS, labelToMetricKey, METRIC_ACTIVITIES } from "@/lib/constants";
import { addActivityLog, flushActivityQueue, getActivityQueueSize } from "@/lib/activity";
import { hapticHeavy, hapticLight, hapticMedium } from "@/lib/haptics";
import { isRestDay } from "@/lib/restDays";
import { HabitDetailSheet } from "@/app/app/_components/HabitDetailSheet";
import { HealthCard } from "@/app/app/_components/HealthCard";
import { DailyWisdom } from "@/app/app/_components/DailyWisdom";
import { SmartRecommendations } from "@/app/app/_components/SmartRecommendations";
import { StreakInsurance } from "@/app/app/_components/StreakInsurance";
import Link from "next/link";
import { updateWidgetData } from "@/lib/widgetData";
import { checkAutoComplete } from "@/lib/healthAutoComplete";
import { usePremium } from "@/lib/premium";
import { canUseFreeze, useStreakFreeze, remainingFreezes } from "@/lib/streakFreeze";
import { listReminders, type Reminder } from "@/lib/reminders";
import { checkMilestones, popPendingMilestone } from "@/lib/milestones";
import type { Milestone } from "@/lib/milestones";
import type { MotivationContext } from "@/lib/motivation";

// ---------------------------------------------------------------------------
// Greeting helper
// ---------------------------------------------------------------------------
function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Late night";
}

// ===========================================================================
// TODAY PAGE — THE DAILY RITUAL
// ===========================================================================
// Psychology notes woven into the code:
// 
// 1. VARIABLE REWARD: Motivation message changes daily (not stale)
// 2. LOSS AVERSION: Streak-at-risk warning in evening
// 3. ENDOWED PROGRESS: "4/6 core" not "2 left" (until close to done)
// 4. GOAL GRADIENT: Progress bar toward next milestone accelerates near end
// 5. PEAK-END RULE: Green day celebration + milestone modal = peak moments
// 6. COMEBACK WARMTH: No shame after missed days
// 7. IDENTITY: "14-day streak" reinforces "I am consistent"
// 8. COLLECTION: Trophies link creates aspiration
// ===========================================================================
export default function TodayPage() {
  const router = useRouter();
  const { today, dateKey } = useToday();

  // Core state
  const routine = useRoutineDay(dateKey);
  const streaks = useStreaks(dateKey);
  const { saveState, debouncedPersist, flushNow, persistSnooze } = usePersist({
    dateKey,
    itemsRef: routine.itemsRef,
  });

  // Local UI state
  const [dayMode, setDayMode] = useState(routine.dayMode);
  const [items, setItems] = useState(routine.items);
  const [snoozedUntil, setSnoozedUntil] = useState(routine.snoozedUntil);
  const [recentlyDoneId, setRecentlyDoneId] = useState<string | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [metricOpen, setMetricOpen] = useState(false);
  const [metricKind, setMetricKind] = useState<MetricKind | null>(null);
  const [syncQueueCount, setSyncQueueCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [justCompletedAll, setJustCompletedAll] = useState(false);
  const [autoCompleted, setAutoCompleted] = useState<Map<string, string>>(new Map());

  // Section visibility (user-configurable)
  const [healthHidden, setHealthHidden] = useState(false);
  const [questsHidden, setQuestsHidden] = useState(false);
  const [waterHidden, setWaterHidden] = useState(false);
  const [wisdomHidden, setWisdomHidden] = useState(false);
  const [quickActionsHidden, setQuickActionsHidden] = useState(false);
  const [smartTipsHidden, setSmartTipsHidden] = useState(false);
  useEffect(() => {
    try { setHealthHidden(localStorage.getItem("routines365:healthCard:hidden") === "1"); } catch {}
    try { setQuestsHidden(localStorage.getItem("routines365:quests:hidden") === "1"); } catch {}
    try { setWaterHidden(localStorage.getItem("routines365:water:hidden") === "1"); } catch {}
    try { setWisdomHidden(localStorage.getItem("routines365:wisdom:hidden") === "1"); } catch {}
    try { setQuickActionsHidden(localStorage.getItem("routines365:quickActions:hidden") === "1"); } catch {}
    try { setSmartTipsHidden(localStorage.getItem("routines365:smartTips:hidden") === "1"); } catch {}
  }, []);

  // Psychology state
  const [milestoneToShow, setMilestoneToShow] = useState<Milestone | null>(null);
  const [comebackDismissed, setComebackDismissed] = useState(false);
  const [halfwayShown, setHalfwayShown] = useState(false);
  const [todayIsRest, setTodayIsRest] = useState(false);
  const [habitDetailOpen, setHabitDetailOpen] = useState(false);
  const [habitDetailItem, setHabitDetailItem] = useState<{ id: string; label: string; emoji: string | null; isCore: boolean } | null>(null);
  const { isPremium } = usePremium();

  // Auto-detect rest day and offer to apply
  useEffect(() => {
    if (isRestDay(dateKey) && dayMode === "normal") {
      setTodayIsRest(true);
    }
  }, [dateKey, dayMode]);

  // Reminder state
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderTarget, setReminderTarget] = useState<{ id: string; label: string; emoji?: string } | null>(null);
  const reminderMap = useMemo(() => {
    const m = new Map<string, Reminder>();
    for (const r of reminders) m.set(r.routine_item_id, r);
    return m;
  }, [reminders]);

  // Load reminders on mount
  useEffect(() => {
    listReminders().then(setReminders).catch(() => {});
  }, []);

  // Guard: don't fire haptics / confetti on initial data load — only on
  // user-initiated state changes.
  const initialLoadDone = useRef(false);
  const prevAllCoreDone = useRef<boolean | null>(null);

  // Sync hook state → local
  useEffect(() => {
    setItems(routine.items);
    setDayMode(routine.dayMode);
    setSnoozedUntil(routine.snoozedUntil);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine.loading]);

  useEffect(() => { routine.itemsRef.current = items; }, [items, routine.itemsRef]);

  // Auto-redirect to onboarding if user has no routines
  // IMPORTANT: check routine.items (source of truth), NOT local `items` state,
  // because the sync effect may not have run yet after loading completes.
  useEffect(() => {
    if (!routine.loading && routine.items.length === 0) {
      router.replace("/app/onboarding");
    }
  }, [routine.loading, routine.items.length, router]);

  // Check for pending milestone on mount (from previous session)
  useEffect(() => {
    const pending = popPendingMilestone();
    if (pending) {
      // Show after a beat so the page renders first
      setTimeout(() => setMilestoneToShow(pending), 800);
    }
  }, []);

  // Sync queue
  useEffect(() => {
    const update = () => setSyncQueueCount(getActivityQueueSize());
    update();
    window.addEventListener("routines365:activityQueueChanged", update);
    window.addEventListener("online", () => void flushActivityQueue());
    return () => window.removeEventListener("routines365:activityQueueChanged", update);
  }, []);

  // Derived
  const now = Date.now();
  const activeSnoozed = (id: string) => snoozedUntil[id] != null && snoozedUntil[id] > now;
  const coreItems = useMemo(() => items.filter((i) => i.isNonNegotiable && !activeSnoozed(i.id)), [items, snoozedUntil]); // eslint-disable-line
  const optionalItems = useMemo(() => items.filter((i) => !i.isNonNegotiable && !activeSnoozed(i.id)), [items, snoozedUntil]); // eslint-disable-line
  const coreDone = coreItems.filter((i) => i.done).length;
  const coreTotal = coreItems.length;
  const optionalDone = optionalItems.filter((i) => i.done).length;
  const score = coreTotal === 0 ? 0 : Math.round((coreDone / coreTotal) * 100);
  const allCoreDone = coreTotal > 0 && coreDone === coreTotal;

  // Week strip with live today color
  const last7WithToday = useMemo(() => {
    const color = coreTotal === 0 ? "empty" as const : allCoreDone ? "green" as const : (coreTotal - coreDone) <= 1 ? "yellow" as const : "red" as const;
    if (streaks.last7Days.length === 0) return [];
    const copy = [...streaks.last7Days];
    const last = copy[copy.length - 1];
    if (last?.dateKey === dateKey) copy[copy.length - 1] = { ...last, color };
    return copy;
  }, [streaks.last7Days, dateKey, coreDone, coreTotal, allCoreDone]);

  // ── Motivation context ──
  const motivationCtx: MotivationContext = useMemo(() => ({
    currentStreak: streaks.currentStreak,
    bestStreak: streaks.bestStreak,
    coreDone,
    coreTotal,
    allCoreDone,
    daysSinceLastGreen: streaks.daysSinceLastGreen,
    greenThisWeek: streaks.greenDaysThisWeek,
    greenLastWeek: streaks.greenDaysLastWeek,
  }), [streaks, coreDone, coreTotal, allCoreDone]);

  // ── Push data to home screen widget ──
  useEffect(() => {
    void updateWidgetData({
      streak: streaks.activeStreak,
      bestStreak: streaks.bestStreak,
      todayDone: coreDone,
      todayTotal: coreTotal,
      greenToday: allCoreDone,
    });
  }, [streaks.activeStreak, streaks.bestStreak, coreDone, coreTotal, allCoreDone]);

  // ── Milestone check on green day completion ──
  useEffect(() => {
    if (!allCoreDone || streaks.loading) return;
    // totalGreenDays from useStreaks may not include today yet (data loads from
    // Supabase before today's checks are persisted). When allCoreDone is true,
    // today IS green, so ensure it's counted. Use activeStreak + 1 as a floor.
    const todayIsGreen = allCoreDone;
    const effectiveStreak = todayIsGreen
      ? Math.max(streaks.currentStreak, streaks.activeStreak + (streaks.currentStreak === 0 ? 1 : 0))
      : streaks.currentStreak;
    const effectiveTotal = Math.max(streaks.totalGreenDays, todayIsGreen ? effectiveStreak : 0);
    const result = checkMilestones({
      currentStreak: effectiveStreak,
      bestStreak: Math.max(streaks.bestStreak, effectiveStreak),
      totalGreenDays: effectiveTotal,
      previousBestStreak: streaks.previousBestStreak,
    });
    if (result) {
      // Delay so confetti plays first, then milestone modal
      setTimeout(() => setMilestoneToShow(result), 1200);
    }
  }, [allCoreDone, streaks.loading, streaks.currentStreak, streaks.activeStreak, streaks.bestStreak, streaks.totalGreenDays, streaks.previousBestStreak]);

  // ── Halfway micro-feedback ──
  useEffect(() => {
    if (!initialLoadDone.current) return;
    if (halfwayShown || coreTotal < 4) return;
    if (coreDone === Math.ceil(coreTotal / 2) && !allCoreDone) {
      setHalfwayShown(true);
      hapticMedium();
    }
  }, [coreDone, coreTotal, allCoreDone, halfwayShown]);

  // Actions
  const toggleItem = useCallback((id: string) => {
    let wasCheckedOn = false;
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      wasCheckedOn = !!item && !item.done; // unchecked → checked
      const next = prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
      routine.itemsRef.current = next;
      return next;
    });
    debouncedPersist(dayMode);

    // Phase 2: auto-open metric sheet when checking a metric item done
    if (wasCheckedOn) {
      const item = items.find((i) => i.id === id);
      if (item) {
        const metricKey = labelToMetricKey(item.label);
        if (metricKey && metricKey !== "hydration" && METRIC_ACTIVITIES[metricKey]) {
          const promptedKey = `routines365:metricPrompted:${dateKey}:${id}`;
          if (!localStorage.getItem(promptedKey)) {
            setTimeout(() => {
              const act = METRIC_ACTIVITIES[metricKey];
              setMetricKind({ key: act.key, title: act.title, emoji: act.emoji } as MetricKind);
              setMetricOpen(true);
              try { localStorage.setItem(promptedKey, "1"); } catch { /* ignore */ }
            }, 400); // brief delay so checkbox animation plays first
          }
        }
      }
    }
  }, [dayMode, debouncedPersist, routine.itemsRef, items, dateKey]);

  const markDone = useCallback((id: string) => {
    setRecentlyDoneId(id);
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, done: true } : i));
      routine.itemsRef.current = next;
      return next;
    });
    debouncedPersist(dayMode);
    setTimeout(() => setRecentlyDoneId(null), 600);
  }, [dayMode, debouncedPersist, routine.itemsRef]);

  const markAllCoreDone = useCallback(() => {
    setItems((prev) => {
      const next = prev.map((i) => (i.isNonNegotiable ? { ...i, done: true } : i));
      routine.itemsRef.current = next;
      return next;
    });
    hapticHeavy();
    const celebratedKey = `routines365:celebrated:${dateKey}`;
    if (!localStorage.getItem(celebratedKey)) {
      setConfettiTrigger(true);
      setTimeout(() => setConfettiTrigger(false), 100);
      try { localStorage.setItem(celebratedKey, "1"); } catch { /* ignore */ }
    }
    setJustCompletedAll(true);
    debouncedPersist(dayMode);
  }, [dayMode, debouncedPersist, routine.itemsRef, dateKey]);

  // ── HealthKit auto-complete ──
  // On first load, check if any habits match HealthKit data and auto-mark them done
  const autoCompleteRan = useRef(false);
  useEffect(() => {
    if (routine.loading || autoCompleteRan.current || items.length === 0) return;
    autoCompleteRan.current = true;

    void (async () => {
      try {
        const result = await checkAutoComplete(
          items.map((i) => ({ id: i.id, label: i.label, done: i.done }))
        );
        if (result.matches.size === 0) return;

        // Auto-mark matched habits as done
        const matchIds = new Set(result.matches.keys());
        setItems((prev) => {
          const next = prev.map((i) => matchIds.has(i.id) ? { ...i, done: true } : i);
          routine.itemsRef.current = next;
          return next;
        });
        debouncedPersist(dayMode);

        // Track what was auto-completed for UI badges
        const acMap = new Map<string, string>();
        for (const [id, info] of result.matches) {
          acMap.set(id, info.value);
        }
        setAutoCompleted(acMap);
      } catch { /* HealthKit not authorized or unavailable */ }
    })();
  }, [routine.loading, items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Confetti on natural all-core completion — only when user completes cores
  // during this session, NOT on page load when they're already done.
  // Also only celebrate ONCE per calendar day.
  useEffect(() => {
    // First time we see real data: capture initial state, don't celebrate
    if (prevAllCoreDone.current === null) {
      prevAllCoreDone.current = allCoreDone;
      initialLoadDone.current = true;
      return;
    }
    // Only fire when allCoreDone transitions from false → true
    if (allCoreDone && !prevAllCoreDone.current && coreDone > 0 && !justCompletedAll) {
      const celebratedKey = `routines365:celebrated:${dateKey}`;
      if (!localStorage.getItem(celebratedKey)) {
        hapticHeavy();
        setConfettiTrigger(true);
        setTimeout(() => setConfettiTrigger(false), 100);
        try { localStorage.setItem(celebratedKey, "1"); } catch { /* ignore */ }
      }
    }
    prevAllCoreDone.current = allCoreDone;
    if (!allCoreDone) setJustCompletedAll(false);
  }, [allCoreDone, coreDone, justCompletedAll, dateKey]);

  const skipItem = useCallback((id: string) => {
    setSnoozedUntil((prev) => ({ ...prev, [id]: Date.now() + SNOOZE_DURATION_MS }));
    void persistSnooze(id);
  }, [persistSnooze]);

  const changeDayMode = useCallback((mode: typeof dayMode) => {
    setDayMode(mode);
    hapticLight();
    debouncedPersist(mode);
    setMenuOpen(false);
  }, [debouncedPersist]);

  const openMetric = useCallback((id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const key = labelToMetricKey(item.label);
    if (!key || !METRIC_ACTIVITIES[key]) return;
    const act = METRIC_ACTIVITIES[key];
    setMetricKind({ key: act.key, title: act.title, emoji: act.emoji } as MetricKind);
    setMetricOpen(true);
  }, [items]);

  // ── Dynamic headline ──
  const headline = allCoreDone
    ? "Green day ✓"
    : coreTotal - coreDone === 1
      ? "One more to go!"
      : halfwayShown && coreDone >= Math.ceil(coreTotal / 2) && !allCoreDone
        ? "Halfway there 💪"
        : coreDone === 0 && coreTotal > 0
          ? "Let's build momentum"
          : coreTotal > 0
            ? `${coreTotal - coreDone} to go`
            : "";

  // Loading
  if (routine.loading) return <TodayPageSkeleton />;

  // No routines yet → send straight to onboarding (no dead empty state)
  // Use routine.items (source of truth) to avoid flash from sync effect lag.
  if (routine.items.length === 0) {
    return <TodayPageSkeleton />;
  }

  // Sync effect hasn't run yet — keep showing skeleton until local state catches up
  if (items.length === 0) {
    return <TodayPageSkeleton />;
  }

  return (
    <div className="space-y-5 pb-2 stagger-sections">
      <ConfettiBurst trigger={confettiTrigger} />
      <Toast state={saveState} queuedCount={syncQueueCount} />
      <MilestoneModal milestone={milestoneToShow} onDismiss={() => setMilestoneToShow(null)} />

      {/* ─── HEADER ─── */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-base font-medium" style={{ color: "var(--text-muted)" }}>
            {greeting()} 👋
          </p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {format(today, "EEEE")}
            <span className="ml-2 text-base font-normal" style={{ color: "var(--text-muted)" }}>
              {format(today, "MMM d")}
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Trophies shortcut (appears after first milestone earned) */}
          {!streaks.loading && (streaks.activeStreak >= 3 || streaks.totalGreenDays >= 1) && (
            <button type="button" onClick={() => { hapticLight(); router.push("/app/trophies"); }}
              className="tap-btn flex items-center justify-center rounded-full"
              style={{ width: 40, height: 40, background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}
              aria-label="Trophies">
              <Trophy size={17} style={{ color: "var(--accent-green-text)" }} />
            </button>
          )}
          <button type="button" onClick={() => { hapticLight(); setMenuOpen(true); }}
            className="tap-btn flex items-center justify-center rounded-full"
            style={{ width: 40, height: 40, background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}
            aria-label="More options">
            <MoreHorizontal size={18} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>
      </header>

      {/* ─── REST DAY BANNER ─── */}
      {todayIsRest && dayMode === "normal" && (
        <section className="rounded-2xl p-4 animate-fade-in-up"
          style={{ background: "var(--accent-green-soft)", border: "1px solid var(--accent-green)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧘</span>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--accent-green-text)" }}>Scheduled rest day</p>
                <p className="text-xs" style={{ color: "var(--accent-green-text)", opacity: 0.8 }}>Take today off without breaking your streak</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button type="button" onClick={() => { hapticLight(); setTodayIsRest(false); }}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                style={{ color: "var(--text-muted)", background: "var(--bg-card-hover)" }}>
                Skip
              </button>
              <button type="button" onClick={() => { hapticMedium(); changeDayMode("travel"); setTodayIsRest(false); }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>
                Rest today
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ─── COMEBACK BANNER (after 2+ missed days) ─── */}
      {!streaks.loading && !comebackDismissed && streaks.daysSinceLastGreen >= 2 && streaks.currentStreak === 0 && (
        <ComebackBanner
          daysSinceLastGreen={streaks.daysSinceLastGreen}
          previousStreak={streaks.previousBestStreak || streaks.bestStreak}
          onDismiss={() => setComebackDismissed(true)}
        />
      )}

      {/* ─── MOTIVATION BANNER ─── */}
      {!streaks.loading && (comebackDismissed || streaks.daysSinceLastGreen < 2 || streaks.currentStreak > 0) && (
        <MotivationBanner ctx={motivationCtx} />
      )}

      {/* ─── SCORE CARD ─── */}
      <section className="card p-5">
        <div className="flex items-center gap-5">
          <ProgressRing progress={score} size={96} strokeWidth={8} subtitle={allCoreDone ? "done!" : "score"} />

          <div className="flex-1 space-y-1.5">
            <p className="text-base font-semibold" style={{ color: allCoreDone ? "var(--accent-green-text)" : "var(--text-primary)" }}>
              {headline}
            </p>

            <div className="flex items-baseline gap-3">
              <span className="text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
                {coreDone}/{coreTotal} core
              </span>
              {optionalDone > 0 && (
                <span className="text-sm tabular-nums" style={{ color: "var(--accent-green-text)" }}>
                  +{optionalDone} bonus
                </span>
              )}
            </div>

            {/* Streak display with identity reinforcement */}
            {!streaks.loading && streaks.activeStreak > 0 && (
              <button type="button" onClick={() => { hapticLight(); router.push("/app/trophies"); }}
                className="flex items-center gap-1.5 -ml-0.5"
                aria-label={`${streaks.activeStreak} day streak - view trophies`}>
                <span className={streaks.activeStreak >= 3 ? "animate-streak-glow" : ""} style={{ fontSize: "18px" }}>🔥</span>
                <span className="text-base font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {streaks.activeStreak}
                </span>
                <span className="text-sm" style={{ color: "var(--text-faint)" }}>
                  day streak
                  {streaks.bestStreak > streaks.activeStreak ? ` · best ${streaks.bestStreak}` : ""}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Week strip */}
        <div className="mt-4 flex justify-center">
          <WeekStrip days={last7WithToday} />
        </div>

        {/* Next milestone progress bar */}
        {!streaks.loading && streaks.activeStreak >= 1 && (
          <NextMilestoneTeaser
            currentStreak={streaks.activeStreak}
            totalGreenDays={streaks.totalGreenDays}
          />
        )}
      </section>

      {/* ─── GREEN DAY CELEBRATION ─── */}
      {allCoreDone && (
        <section className="rounded-2xl p-5 text-center animate-celebrate-in"
          style={{ background: "var(--accent-green-soft)", border: "1px solid var(--accent-green)" }}>
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-base font-bold" style={{ color: "var(--accent-green-text)" }}>Green Day!</p>
          <p className="text-sm mt-1" style={{ color: "var(--accent-green-text)", opacity: 0.8 }}>
            {streaks.currentStreak >= 7
              ? `${streaks.currentStreak} days and counting. You're built different.`
              : streaks.currentStreak >= 3
                ? `${streaks.currentStreak}-day streak! The momentum is real.`
                : optionalItems.length > 0 && optionalDone < optionalItems.length
                  ? "All core done. Check off some bonus habits?"
                  : "All core habits done. You earned this."
            }
          </p>
        </section>
      )}

      {/* ─── QUESTS ─── */}
      {!streaks.loading && !questsHidden && (
        <QuestsCard
          greenDaysThisWeek={streaks.greenDaysThisWeek}
          checkedLabels={items.filter((i) => i.done).map((i) => i.label)}
          onLogActivity={(metricKey) => {
            const act = METRIC_ACTIVITIES[metricKey];
            if (!act) return;
            setMetricKind({ key: act.key, title: act.title, emoji: act.emoji } as MetricKind);
            setMetricOpen(true);
          }}
        />
      )}

      {/* ─── WATER TRACKER ─── */}
      {!waterHidden && <WaterTracker dateKey={dateKey} />}

      {/* Daily stoic wisdom */}
      {!wisdomHidden && <DailyWisdom />}

      {/* Streak Insurance — shows after 8pm if streak at risk */}
      <StreakInsurance streaks={streaks} allCoreDone={allCoreDone} dateKey={dateKey} />

      {/* Apple Health summary — only shows in native app */}
      {!healthHidden && <HealthCard />}

      {/* Quick Actions */}
      {!quickActionsHidden && (
        <div className="grid grid-cols-3 gap-2">
          <Link href="/app/breathwork" onClick={() => hapticLight()}
            className="rounded-2xl p-3 text-center transition-all active:scale-[0.97]"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", textDecoration: "none" }}>
            <Wind size={20} className="mx-auto mb-1" style={{ color: "#6366f1" }} />
            <p className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>Breathwork</p>
          </Link>
          <Link href="/app/movement" onClick={() => hapticLight()}
            className="rounded-2xl p-3 text-center transition-all active:scale-[0.97]"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", textDecoration: "none" }}>
            <Dumbbell size={20} className="mx-auto mb-1" style={{ color: "#10b981" }} />
            <p className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>Movement</p>
          </Link>
          <Link href="/app/focus" onClick={() => hapticLight()}
            className="rounded-2xl p-3 text-center transition-all active:scale-[0.97]"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", textDecoration: "none" }}>
            <Brain size={20} className="mx-auto mb-1" style={{ color: "#3b82f6" }} />
            <p className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>Focus</p>
          </Link>
        </div>
      )}

      {/* Smart Recommendations */}
      {!smartTipsHidden && <SmartRecommendations streaks={streaks} />}

      {/* Setup prompts for new users — notifications, health */}
      <SetupPrompts />

      {/* ─── CORE HABITS ─── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
            Core
          </p>
          <p className="text-xs tabular-nums font-semibold" style={{ color: allCoreDone ? "var(--accent-green-text)" : "var(--text-muted)" }}>
            {coreDone}/{coreTotal}
          </p>
        </div>

        <div className="space-y-2.5 stagger-children">
          {coreItems.map((item) => (
            <RoutineCheckItem
              key={item.id}
              id={item.id}
              label={item.label}
              emoji={item.emoji}
              isCore
              done={item.done}
              justCompleted={recentlyDoneId === item.id}
              autoCompletedBy={autoCompleted.get(item.id)}
              hasMetric={!!labelToMetricKey(item.label) && labelToMetricKey(item.label) !== "hydration"}
              hasReminder={reminderMap.has(item.id)}
              onToggle={item.done ? toggleItem : markDone}
              onSkip={skipItem}
              onLogMetric={openMetric}
              onSetReminder={(id) => setReminderTarget({ id, label: item.label, emoji: item.emoji })}
              onLabelTap={(id) => {
                setHabitDetailItem({ id, label: item.label, emoji: item.emoji ?? null, isCore: true });
                setHabitDetailOpen(true);
              }}
            />
          ))}
        </div>
      </section>

      {/* ─── BONUS HABITS ─── */}
      {optionalItems.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>
              Bonus
            </p>
            <span className="text-xs tabular-nums font-semibold" style={{ color: "var(--text-faint)" }}>
              {optionalDone}/{optionalItems.length}
            </span>
          </div>

          <div className="space-y-2 stagger-children">
            {optionalItems.map((item) => (
              <RoutineCheckItem
                key={item.id}
                id={item.id}
                label={item.label}
                emoji={item.emoji}
                isCore={false}
                done={item.done}
                justCompleted={recentlyDoneId === item.id}
                autoCompletedBy={autoCompleted.get(item.id)}
                hasMetric={!!labelToMetricKey(item.label) && labelToMetricKey(item.label) !== "hydration"}
                hasReminder={reminderMap.has(item.id)}
                onToggle={item.done ? toggleItem : markDone}
                onSkip={skipItem}
                onLogMetric={openMetric}
                onSetReminder={(id) => setReminderTarget({ id, label: item.label, emoji: item.emoji })}
                onLabelTap={(id) => {
                  setHabitDetailItem({ id, label: item.label, emoji: item.emoji ?? null, isCore: false });
                  setHabitDetailOpen(true);
                }}
                compact
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── OVERFLOW MENU ─── */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Options">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-muted)" }}>Day mode</p>
            <div className="grid grid-cols-3 gap-2">
              {(["normal", "travel", "sick"] as const).map((mode) => (
                <button key={mode} type="button"
                  className={dayMode === mode ? "btn-primary text-sm py-2.5 capitalize" : "btn-secondary text-sm py-2.5 capitalize"}
                  onClick={() => { hapticLight(); changeDayMode(mode); }}>
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {!allCoreDone && coreTotal > 0 && (
            <div>
              <p className="text-xs font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-muted)" }}>Quick actions</p>
              <div className="space-y-2">
                <button type="button" onClick={() => { hapticHeavy(); markAllCoreDone(); setMenuOpen(false); }}
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
                  <Zap size={14} /> Mark all core done
                </button>
                {streaks.currentStreak > 0 && canUseFreeze(isPremium) && (
                  <button type="button" onClick={() => {
                    hapticMedium();
                    const ok = useStreakFreeze(isPremium);
                    if (ok) { changeDayMode("travel"); setMenuOpen(false); }
                  }}
                    className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
                    🧊 Use streak freeze
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1"
                      style={{ background: "var(--bg-card-hover)", color: "var(--text-faint)" }}>
                      {(() => { const r = remainingFreezes(isPremium); return r === "unlimited" ? "∞" : `${r} left`; })()}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-muted)" }}>Navigate</p>
            <div className="space-y-2">
              <button type="button" onClick={() => { hapticLight(); setMenuOpen(false); router.push("/app/trophies"); }}
                className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
                <Trophy size={14} /> Trophies & milestones
              </button>
              <button type="button" onClick={() => { hapticLight(); setMenuOpen(false); router.push("/app/settings/routines"); }}
                className="btn-secondary w-full text-sm">
                Edit routines
              </button>
              <button type="button" onClick={() => { hapticLight(); setMenuOpen(false); router.push("/app/settings"); }}
                className="btn-secondary w-full text-sm">
                ⚙️ Settings
              </button>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Metric Sheet */}
      <MetricSheet
        open={metricOpen}
        kind={metricKind}
        onClose={() => { setMetricOpen(false); setMetricKind(null); }}
        onSave={async (p) => {
          if (!metricKind) return;
          if (metricKind.key === "rowing" && p.meters) {
            await addActivityLog({ dateKey, activityKey: "rowing", value: p.meters, unit: "meters" });
            if (p.minutes) await addActivityLog({ dateKey, activityKey: "rowing", value: p.minutes, unit: "minutes" });
            return;
          }
          if (metricKind.key === "running" && p.miles) {
            await addActivityLog({ dateKey, activityKey: "running", value: p.miles, unit: "miles" });
            return;
          }
          if (metricKind.key === "walking" && p.steps) {
            await addActivityLog({ dateKey, activityKey: "walking", value: p.steps, unit: "steps" });
            return;
          }
          if ((metricKind.key === "sauna" || metricKind.key === "cold") && p.sessions) {
            await addActivityLog({ dateKey, activityKey: metricKind.key, value: p.sessions, unit: "sessions" });
            return;
          }
          if (metricKind.key === "sleep" && p.hours) {
            await addActivityLog({ dateKey, activityKey: "sleep_hours", value: p.hours, unit: "hours" });
            if (p.score) await addActivityLog({ dateKey, activityKey: "sleep_score", value: p.score, unit: "score" });
          }
        }}
      />

      {routine.isFallback && (
        <p className="text-center text-xs" style={{ color: "var(--text-faint)" }}>
          Nothing scheduled — showing core habits.
        </p>
      )}

      <GettingStartedTips />

      {/* Reminder Sheet */}
      <ReminderSheet
        open={!!reminderTarget}
        onClose={() => setReminderTarget(null)}
        routineItemId={reminderTarget?.id ?? ""}
        routineLabel={reminderTarget?.label ?? ""}
        routineEmoji={reminderTarget?.emoji}
        existing={reminderTarget ? reminderMap.get(reminderTarget.id) ?? null : null}
        onSaved={() => { listReminders().then(setReminders).catch(() => {}); }}
      />

      {/* Habit Detail Sheet (per-habit analytics) */}
      <HabitDetailSheet
        open={habitDetailOpen}
        onClose={() => setHabitDetailOpen(false)}
        habit={habitDetailItem}
      />
    </div>
  );
}
