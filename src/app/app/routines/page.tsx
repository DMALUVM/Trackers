"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { TrendingUp, Zap } from "lucide-react";

import { useToday, useRoutineDay, usePersist, useStreaks } from "@/lib/hooks";
import {
  RoutineCheckItem,
  SkeletonCard,
  SkeletonLine,
  Toast,
  BottomSheet,
  WeekStrip,
  ConfettiBurst,
  EmptyState,
  ProgressRing,
} from "@/app/app/_components/ui";
import { SNOOZE_DURATION_MS, labelToMetricKey, METRIC_ACTIVITIES } from "@/lib/constants";
import { MetricSheet, type MetricKind } from "@/app/app/_components/MetricSheet";
import { addActivityLog } from "@/lib/activity";
import type { DayMode } from "@/lib/types";

// ===========================================================================
// ROUTINES PAGE
// ===========================================================================
export default function RoutinesPage() {
  const router = useRouter();
  const { today, dateKey } = useToday();

  const routine = useRoutineDay(dateKey);
  const streaks = useStreaks(dateKey);
  const { saveState, debouncedPersist, flushNow, persistSnooze } = usePersist({
    dateKey,
    itemsRef: routine.itemsRef,
  });

  // ---- Local UI state ----
  const [dayMode, setDayMode] = useState(routine.dayMode);
  const [items, setItems] = useState(routine.items);
  const [snoozedUntil, setSnoozedUntil] = useState(routine.snoozedUntil);
  const [showGettingStarted, setShowGettingStarted] = useState(false);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [wrapUpOpen, setWrapUpOpen] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [metricOpen, setMetricOpen] = useState(false);
  const [metricKind, setMetricKind] = useState<MetricKind | null>(null);

  // Sync hook → local on reload
  useEffect(() => {
    setItems(routine.items);
    setDayMode(routine.dayMode);
    setSnoozedUntil(routine.snoozedUntil);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine.loading]);

  useEffect(() => { routine.itemsRef.current = items; }, [items, routine.itemsRef]);

  // Getting-started banner
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("routines365:gettingStarted:dismissed") : "1";
    setShowGettingStarted(raw !== "1");
  }, []);

  // Redirect to onboarding if signed in but no routines
  useEffect(() => {
    if (!routine.loading && items.length === 0 && routine.routineItemsRef.current.length === 0) {
      router.replace("/app/onboarding");
    }
  }, [routine.loading, items.length, routine.routineItemsRef, router]);

  // ---- Derived ----
  const now = Date.now();
  const activeSnoozed = (id: string) => snoozedUntil[id] != null && snoozedUntil[id] > now;

  const coreItems = useMemo(
    () => items.filter((i) => i.isNonNegotiable && !activeSnoozed(i.id)),
    [items, snoozedUntil] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const optionalItems = useMemo(
    () => items.filter((i) => !i.isNonNegotiable && !activeSnoozed(i.id)),
    [items, snoozedUntil] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const coreDone = coreItems.filter((i) => i.done).length;
  const coreTotal = coreItems.length;
  const allCoreDone = coreTotal > 0 && coreDone === coreTotal;
  const score = coreTotal === 0 ? 0 : Math.round((coreDone / coreTotal) * 100);
  const completed = items.filter((i) => i.done).length;

  const last7WithToday = useMemo(() => {
    if (streaks.last7Days.length === 0) return [];
    const immediateColor =
      coreTotal === 0 ? ("empty" as const)
        : coreDone === coreTotal ? ("green" as const)
          : coreTotal - coreDone === 1 ? ("yellow" as const) : ("red" as const);
    const copy = [...streaks.last7Days];
    const last = copy[copy.length - 1];
    if (last?.dateKey === dateKey) copy[copy.length - 1] = { ...last, color: immediateColor };
    return copy;
  }, [streaks.last7Days, dateKey, coreDone, coreTotal]);

  const missingCore = useMemo(() => coreItems.filter((i) => !i.done), [coreItems]);

  // ---- Actions ----
  const toggleItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
      routine.itemsRef.current = next;
      return next;
    });
    debouncedPersist(dayMode);
  }, [dayMode, debouncedPersist, routine.itemsRef]);

  const markAllCoreDone = useCallback(() => {
    setItems((prev) => {
      const next = prev.map((i) => (i.isNonNegotiable ? { ...i, done: true } : i));
      routine.itemsRef.current = next;
      return next;
    });
    setConfettiTrigger(true);
    setTimeout(() => setConfettiTrigger(false), 100);
    debouncedPersist(dayMode);
  }, [dayMode, debouncedPersist, routine.itemsRef]);

  const skipItem = useCallback((id: string) => {
    setSnoozedUntil((prev) => ({ ...prev, [id]: Date.now() + SNOOZE_DURATION_MS }));
    void persistSnooze(id);
  }, [persistSnooze]);

  const changeDayMode = useCallback((mode: DayMode) => {
    setDayMode(mode);
    debouncedPersist(mode);
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

  // Confetti on natural all-core completion
  useEffect(() => {
    if (allCoreDone && coreDone > 0) {
      setConfettiTrigger(true);
      setTimeout(() => setConfettiTrigger(false), 100);
    }
  }, [allCoreDone, coreDone]);

  // ---- Loading ----
  if (routine.loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <header><SkeletonLine width="120px" height="24px" /></header>
        <SkeletonCard lines={4} />
        <SkeletonCard lines={3} />
      </div>
    );
  }

  // ---- Empty state ----
  if (items.length === 0) {
    return (
      <div className="space-y-5">
        <header>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Routines</h1>
        </header>
        <EmptyState
          emoji="🌱"
          title="No routines yet"
          description="Set up your daily habits to start tracking."
          actionLabel="Get started"
          actionHref="/app/onboarding"
        />
      </div>
    );
  }

  // ---- Main render ----
  return (
    <div className="space-y-5 pb-2">
      <ConfettiBurst trigger={confettiTrigger} />
      <Toast state={saveState} />

      {/* Getting started */}
      {showGettingStarted && (
        <section className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Getting started</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Make it yours in 60 seconds.</p>
            </div>
            <button type="button" className="btn-secondary text-xs py-2 px-3" onClick={() => {
              localStorage.setItem("routines365:gettingStarted:dismissed", "1");
              setShowGettingStarted(false);
            }}>Dismiss</button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a className="btn-primary text-center text-sm" href="/app/settings/routines">Set Core habits</a>
            <a className="btn-secondary text-center text-sm" href="/app/settings/modules">Choose tabs</a>
            <a className="btn-secondary text-center text-sm" href="/app/routines/progress">View Progress</a>
            <a className="btn-secondary text-center text-sm" href="/app/settings/security">Enable Face ID</a>
          </div>
        </section>
      )}

      {/* Header */}
      <header>
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Routines</h1>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5" onClick={() => setQuickLogOpen(true)}>
              <Zap size={14} /> Quick Log
            </button>
            <Link href="/app/routines/progress" className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5">
              <TrendingUp size={14} /> Progress
            </Link>
          </div>
        </div>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{format(today, "EEEE, MMM d")}</p>
      </header>

      {/* Analytics card */}
      <section className="card p-5">
        <div className="flex items-center gap-5">
          <ProgressRing progress={score} size={100} strokeWidth={8} subtitle="score" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {allCoreDone ? "Green day. Keep the streak alive. 💪"
                : missingCore.length === 1 ? "Almost there. One core habit to go."
                  : missingCore.length > 0 ? `${missingCore.length} core habits left.` : ""}
            </p>
            <div className="flex items-baseline gap-3">
              <div>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Core</span>
                <span className="ml-1 text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{coreDone}/{coreTotal}</span>
              </div>
              <div>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Total</span>
                <span className="ml-1 text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{completed}/{items.length}</span>
              </div>
            </div>
            {!streaks.loading && (
              <div className="flex items-center gap-2">
                <span className={streaks.currentStreak >= 3 ? "animate-streak-glow" : ""} style={{ fontSize: "14px" }}>🔥</span>
                <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{streaks.currentStreak}</span>
                <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                  streak {streaks.bestStreak > streaks.currentStreak ? `· best: ${streaks.bestStreak}` : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-center"><WeekStrip days={last7WithToday} /></div>

        {/* Stats pills */}
        {!streaks.loading && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="card-interactive px-3 py-2.5">
              <p className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>Core hit-rate (week)</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {streaks.coreHitRateThisWeek === null ? "—" : `${streaks.coreHitRateThisWeek}%`}
              </p>
            </div>
            <div className="card-interactive px-3 py-2.5">
              <p className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>Green days (month)</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{streaks.greenDaysThisMonth}</p>
            </div>
          </div>
        )}

        {/* Next actions */}
        {!allCoreDone && missingCore.length > 0 && (
          <div className="mt-4 card-interactive px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Get to Green</p>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: "var(--accent-yellow-soft)", color: "var(--accent-yellow-text)" }}>
                {missingCore.length} left
              </span>
            </div>
            <div className="mt-2 space-y-1">
              {missingCore.slice(0, 3).map((m) => (
                <p key={m.id} className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {m.emoji && <span className="mr-1.5">{m.emoji}</span>}{m.label}
                </p>
              ))}
              {missingCore.length > 3 && (
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>+{missingCore.length - 3} more</p>
              )}
            </div>
          </div>
        )}

        {/* Action row */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Link className="btn-primary text-center text-xs" href="/app/routines/progress">Progress</Link>
          <Link className="btn-secondary text-center text-xs" href={`/app/routines/edit/${dateKey}`}>Fix today</Link>
          <button type="button" className="btn-secondary text-center text-xs" onClick={() => setWrapUpOpen(true)}>Wrap up</button>
        </div>
      </section>

      {/* Checklist */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Today's checklist</p>
          {!allCoreDone && coreTotal > 0 && (
            <button type="button" className="text-[10px] font-semibold px-2 py-1 rounded-full"
              style={{ background: "var(--bg-card-hover)", color: "var(--text-muted)" }}
              onClick={markAllCoreDone}>
              Mark all Core done
            </button>
          )}
        </div>
        <div className="space-y-2 stagger-children">
          {items.map((item) => (
            <RoutineCheckItem
              key={item.id} id={item.id} label={item.label} emoji={item.emoji}
              isCore={item.isNonNegotiable} done={item.done} snoozed={activeSnoozed(item.id)}
              hasMetric={!!labelToMetricKey(item.label)}
              onToggle={toggleItem} onSkip={skipItem} onLogMetric={openMetric} compact
            />
          ))}
        </div>
      </section>

      {/* Quick Log sheet */}
      <BottomSheet open={quickLogOpen} onClose={() => setQuickLogOpen(false)} title="Quick Log">
        <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>Knock out Core habits fast.</p>
        <div className="space-y-2">
          {coreItems.map((item) => (
            <RoutineCheckItem key={item.id} id={item.id} label={item.label} emoji={item.emoji}
              isCore done={item.done} onToggle={toggleItem} compact />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="btn-secondary text-sm" onClick={() => { markAllCoreDone(); setQuickLogOpen(false); }}>
            Mark all Core done
          </button>
          <button type="button" className="btn-primary text-sm" onClick={() => { flushNow(dayMode); setQuickLogOpen(false); }}>
            Save + Close
          </button>
        </div>
      </BottomSheet>

      {/* Wrap Up sheet */}
      <BottomSheet open={wrapUpOpen} onClose={() => setWrapUpOpen(false)} title="Wrap up">
        <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>Quick actions to close out today.</p>
        <div className="space-y-2">
          <button type="button" className="btn-primary w-full text-sm" onClick={() => { markAllCoreDone(); setWrapUpOpen(false); }}>
            Mark all Core done
          </button>
          <div className="grid grid-cols-3 gap-2">
            {(["normal", "travel", "sick"] as const).map((mode) => (
              <button key={mode} type="button" className={dayMode === mode ? "btn-primary text-sm" : "btn-secondary text-sm"}
                onClick={() => { changeDayMode(mode); setWrapUpOpen(false); }}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <button type="button" className="btn-secondary w-full text-sm" onClick={() => { flushNow(dayMode); setWrapUpOpen(false); }}>
            Save now
          </button>
        </div>
      </BottomSheet>

      {/* Metric sheet */}
      <MetricSheet open={metricOpen} kind={metricKind}
        onClose={() => { setMetricOpen(false); setMetricKind(null); }}
        onSave={async (p) => {
          if (!metricKind) return;
          if (metricKind.key === "rowing" && p.meters) {
            await addActivityLog({ dateKey, activityKey: "rowing", value: p.meters, unit: "meters" });
            if (p.minutes) await addActivityLog({ dateKey, activityKey: "rowing", value: p.minutes, unit: "minutes" });
          } else if (metricKind.key === "running" && p.miles) {
            await addActivityLog({ dateKey, activityKey: "running", value: p.miles, unit: "miles" });
          } else if (metricKind.key === "walking" && p.steps) {
            await addActivityLog({ dateKey, activityKey: "walking", value: p.steps, unit: "steps" });
          } else if ((metricKind.key === "sauna" || metricKind.key === "cold") && p.sessions) {
            await addActivityLog({ dateKey, activityKey: metricKind.key, value: p.sessions, unit: "sessions" });
          }
        }}
      />

      {routine.isFallback && (
        <p className="text-center text-xs" style={{ color: "var(--text-faint)" }}>
          Nothing scheduled for today — showing core habits.
        </p>
      )}
    </div>
  );
}
