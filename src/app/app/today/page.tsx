"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, MoreHorizontal, Zap } from "lucide-react";

import { useToday, useRoutineDay, usePersist, useStreaks } from "@/lib/hooks";
import {
  ProgressRing,
  WeekStrip,
  RoutineCheckItem,
  TodayPageSkeleton,
  Toast,
  BottomSheet,
  ConfettiBurst,
  EmptyState,
} from "@/app/app/_components/ui";
import { MetricSheet, type MetricKind } from "@/app/app/_components/MetricSheet";
import { SNOOZE_DURATION_MS, labelToMetricKey, METRIC_ACTIVITIES } from "@/lib/constants";
import { addActivityLog, flushActivityQueue, getActivityQueueSize } from "@/lib/activity";
import { hapticHeavy, hapticLight } from "@/lib/haptics";

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
// TODAY PAGE
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
  const [showOptional, setShowOptional] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [metricOpen, setMetricOpen] = useState(false);
  const [metricKind, setMetricKind] = useState<MetricKind | null>(null);
  const [syncQueueCount, setSyncQueueCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [justCompletedAll, setJustCompletedAll] = useState(false);

  // Sync hook state → local
  useEffect(() => {
    setItems(routine.items);
    setDayMode(routine.dayMode);
    setSnoozedUntil(routine.snoozedUntil);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine.loading]);

  useEffect(() => { routine.itemsRef.current = items; }, [items, routine.itemsRef]);

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
  const coreItems = useMemo(() => items.filter((i) => i.isNonNegotiable && !activeSnoozed(i.id)), [items, snoozedUntil]);
  const optionalItems = useMemo(() => items.filter((i) => !i.isNonNegotiable && !activeSnoozed(i.id)), [items, snoozedUntil]);
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

  // Actions
  const toggleItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
      routine.itemsRef.current = next;
      return next;
    });
    debouncedPersist(dayMode);
  }, [dayMode, debouncedPersist, routine.itemsRef]);

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
    setConfettiTrigger(true);
    setJustCompletedAll(true);
    setTimeout(() => setConfettiTrigger(false), 100);
    debouncedPersist(dayMode);
  }, [dayMode, debouncedPersist, routine.itemsRef]);

  // Confetti on natural all-core completion
  useEffect(() => {
    if (allCoreDone && coreDone > 0 && !justCompletedAll) {
      hapticHeavy();
      setConfettiTrigger(true);
      setTimeout(() => setConfettiTrigger(false), 100);
    }
    // Reset the flag when items change
    if (!allCoreDone) setJustCompletedAll(false);
  }, [allCoreDone, coreDone, justCompletedAll]);

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

  // Headline
  const headline = allCoreDone
    ? "Green day ✓"
    : coreTotal - coreDone === 1
      ? "One more to go"
      : coreDone === 0 && coreTotal > 0
        ? "Let's build momentum"
        : coreTotal > 0
          ? `${coreTotal - coreDone} to go`
          : "";

  // Loading
  if (routine.loading) return <TodayPageSkeleton />;

  // Empty
  if (items.length === 0) {
    return (
      <div className="space-y-5">
        <header>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Today</h1>
        </header>
        <EmptyState emoji="🌱" title="No routines yet"
          description="Set up your daily habits to start tracking. Takes 60 seconds."
          actionLabel="Get started" actionHref="/app/onboarding" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-2">
      <ConfettiBurst trigger={confettiTrigger} />
      <Toast state={saveState} queuedCount={syncQueueCount} />

      {/* ─── HEADER ─── */}
      <header className="flex items-center justify-between pt-1">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            {greeting()} 👋
          </p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {format(today, "EEEE")}
            <span className="ml-2 text-base font-normal" style={{ color: "var(--text-muted)" }}>
              {format(today, "MMM d")}
            </span>
          </h1>
        </div>
        <button type="button" onClick={() => setMenuOpen(true)}
          className="flex items-center justify-center rounded-full transition-colors"
          style={{ width: 40, height: 40, background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}
          aria-label="More options">
          <MoreHorizontal size={18} style={{ color: "var(--text-muted)" }} />
        </button>
      </header>

      {/* ─── SCORE CARD ─── */}
      <section className="card p-5">
        <div className="flex items-center gap-5">
          <ProgressRing progress={score} size={88} strokeWidth={7} subtitle={allCoreDone ? "done!" : "score"} />

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

            {/* Streak */}
            {!streaks.loading && streaks.currentStreak > 0 && (
              <div className="flex items-center gap-1.5">
                <span className={streaks.currentStreak >= 3 ? "animate-streak-glow" : ""} style={{ fontSize: "14px" }}>🔥</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {streaks.currentStreak}
                </span>
                <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                  day streak
                  {streaks.bestStreak > streaks.currentStreak ? ` · best ${streaks.bestStreak}` : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Week strip */}
        <div className="mt-4 flex justify-center">
          <WeekStrip days={last7WithToday} />
        </div>
      </section>

      {/* ─── GREEN DAY CELEBRATION ─── */}
      {allCoreDone && (
        <section className="rounded-2xl p-5 text-center animate-fade-in-up"
          style={{ background: "var(--accent-green-soft)", border: "1px solid var(--accent-green)" }}>
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-base font-bold" style={{ color: "var(--accent-green-text)" }}>Green Day!</p>
          <p className="text-sm mt-1" style={{ color: "var(--accent-green-text)", opacity: 0.8 }}>
            All core habits done. {optionalItems.length > 0 && !showOptional ? "Check off some bonus habits?" : "You earned this."}
          </p>
        </section>
      )}

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
              hasMetric={!!labelToMetricKey(item.label)}
              onToggle={item.done ? toggleItem : markDone}
              onSkip={skipItem}
              onLogMetric={openMetric}
            />
          ))}
        </div>
      </section>

      {/* ─── OPTIONAL HABITS ─── */}
      {optionalItems.length > 0 && (
        <section>
          <button type="button" className="flex items-center justify-between w-full mb-3"
            onClick={() => { setShowOptional((v) => !v); hapticLight(); }}>
            <p className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>
              Bonus
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs tabular-nums font-semibold" style={{ color: "var(--text-faint)" }}>
                {optionalDone}/{optionalItems.length}
              </span>
              {showOptional
                ? <ChevronUp size={14} style={{ color: "var(--text-faint)" }} />
                : <ChevronDown size={14} style={{ color: "var(--text-faint)" }} />
              }
            </div>
          </button>

          {showOptional && (
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
                  hasMetric={!!labelToMetricKey(item.label)}
                  onToggle={item.done ? toggleItem : markDone}
                  onSkip={skipItem}
                  onLogMetric={openMetric}
                  compact
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ─── OVERFLOW MENU (Day Mode + Quick Actions) ─── */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Options">
        <div className="space-y-4">
          {/* Day mode */}
          <div>
            <p className="text-xs font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-muted)" }}>Day mode</p>
            <div className="grid grid-cols-3 gap-2">
              {(["normal", "travel", "sick"] as const).map((mode) => (
                <button key={mode} type="button"
                  className={dayMode === mode ? "btn-primary text-sm py-2.5 capitalize" : "btn-secondary text-sm py-2.5 capitalize"}
                  onClick={() => changeDayMode(mode)}>
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          {!allCoreDone && coreTotal > 0 && (
            <div>
              <p className="text-xs font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-muted)" }}>Quick actions</p>
              <button type="button" onClick={() => { markAllCoreDone(); setMenuOpen(false); }}
                className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
                <Zap size={14} /> Mark all core done
              </button>
            </div>
          )}

          {/* Nav shortcuts */}
          <div>
            <p className="text-xs font-bold tracking-wider uppercase mb-2" style={{ color: "var(--text-muted)" }}>Settings</p>
            <button type="button" onClick={() => { setMenuOpen(false); router.push("/app/settings/routines"); }}
              className="btn-secondary w-full text-sm">
              Edit routines
            </button>
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
          }
        }}
      />

      {/* Fallback notice */}
      {routine.isFallback && (
        <p className="text-center text-xs" style={{ color: "var(--text-faint)" }}>
          Nothing scheduled — showing core habits.
        </p>
      )}
    </div>
  );
}
