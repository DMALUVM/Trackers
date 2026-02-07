"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";

import { useToday, useRoutineDay, usePersist, useStreaks } from "@/lib/hooks";
import {
  RoutineCheckItem, SkeletonCard, SkeletonLine, Toast, BottomSheet,
  WeekStrip, ConfettiBurst, EmptyState, ProgressRing,
} from "@/app/app/_components/ui";
import { SNOOZE_DURATION_MS, labelToMetricKey, METRIC_ACTIVITIES } from "@/lib/constants";
import { MetricSheet, type MetricKind } from "@/app/app/_components/MetricSheet";
import { addActivityLog } from "@/lib/activity";
import type { DayMode } from "@/lib/types";
import { hapticLight } from "@/lib/haptics";

export default function RoutinesPage() {
  const router = useRouter();
  const { today, dateKey } = useToday();

  const routine = useRoutineDay(dateKey);
  const streaks = useStreaks(dateKey);
  const { saveState, debouncedPersist, flushNow, persistSnooze } = usePersist({ dateKey, itemsRef: routine.itemsRef });

  const [dayMode, setDayMode] = useState(routine.dayMode);
  const [items, setItems] = useState(routine.items);
  const [snoozedUntil, setSnoozedUntil] = useState(routine.snoozedUntil);
  const [showGettingStarted, setShowGettingStarted] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [metricOpen, setMetricOpen] = useState(false);
  const [metricKind, setMetricKind] = useState<MetricKind | null>(null);

  useEffect(() => { setItems(routine.items); setDayMode(routine.dayMode); setSnoozedUntil(routine.snoozedUntil); }, [routine.loading]); // eslint-disable-line
  useEffect(() => { routine.itemsRef.current = items; }, [items, routine.itemsRef]);
  useEffect(() => { setShowGettingStarted(typeof window !== "undefined" ? localStorage.getItem("routines365:gettingStarted:dismissed") !== "1" : false); }, []);
  useEffect(() => { if (!routine.loading && items.length === 0 && routine.routineItemsRef.current.length === 0) router.replace("/app/onboarding"); }, [routine.loading, items.length, routine.routineItemsRef, router]);

  const now = Date.now();
  const activeSnoozed = (id: string) => snoozedUntil[id] != null && snoozedUntil[id] > now;
  const coreItems = useMemo(() => items.filter((i) => i.isNonNegotiable && !activeSnoozed(i.id)), [items, snoozedUntil]); // eslint-disable-line
  const optionalItems = useMemo(() => items.filter((i) => !i.isNonNegotiable && !activeSnoozed(i.id)), [items, snoozedUntil]); // eslint-disable-line
  const coreDone = coreItems.filter((i) => i.done).length;
  const coreTotal = coreItems.length;
  const allCoreDone = coreTotal > 0 && coreDone === coreTotal;
  const score = coreTotal === 0 ? 0 : Math.round((coreDone / coreTotal) * 100);

  const last7WithToday = useMemo(() => {
    if (streaks.last7Days.length === 0) return [];
    const color = coreTotal === 0 ? "empty" as const : allCoreDone ? "green" as const : (coreTotal - coreDone) <= 1 ? "yellow" as const : "red" as const;
    const copy = [...streaks.last7Days];
    const last = copy[copy.length - 1];
    if (last?.dateKey === dateKey) copy[copy.length - 1] = { ...last, color };
    return copy;
  }, [streaks.last7Days, dateKey, coreDone, coreTotal, allCoreDone]);

  const toggleItem = useCallback((id: string) => {
    setItems((prev) => { const next = prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)); routine.itemsRef.current = next; return next; });
    debouncedPersist(dayMode);
  }, [dayMode, debouncedPersist, routine.itemsRef]);

  const skipItem = useCallback((id: string) => { setSnoozedUntil((prev) => ({ ...prev, [id]: Date.now() + SNOOZE_DURATION_MS })); void persistSnooze(id); }, [persistSnooze]);

  const openMetric = useCallback((id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const key = labelToMetricKey(item.label);
    if (!key || !METRIC_ACTIVITIES[key]) return;
    const act = METRIC_ACTIVITIES[key];
    setMetricKind({ key: act.key, title: act.title, emoji: act.emoji } as MetricKind);
    setMetricOpen(true);
  }, [items]);

  useEffect(() => { if (allCoreDone && coreDone > 0) { setConfettiTrigger(true); setTimeout(() => setConfettiTrigger(false), 100); } }, [allCoreDone, coreDone]);

  if (routine.loading) return <div className="space-y-5 animate-fade-in"><SkeletonLine width="120px" height="24px" /><SkeletonCard lines={4} /><SkeletonCard lines={3} /></div>;

  if (items.length === 0) return <div className="space-y-5"><header><h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Routines</h1></header><EmptyState emoji="🌱" title="No routines yet" description="Set up your daily habits to start tracking." actionLabel="Get started" actionHref="/app/onboarding" /></div>;

  return (
    <div className="space-y-6 pb-2">
      <ConfettiBurst trigger={confettiTrigger} />
      <Toast state={saveState} />

      {/* Getting started */}
      {showGettingStarted && (
        <section className="card p-4 animate-fade-in-up">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Welcome! 🎉</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Quick setup to make it yours.</p>
            </div>
            <button type="button" className="rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: "var(--bg-card-hover)", color: "var(--text-muted)" }}
              onClick={() => { localStorage.setItem("routines365:gettingStarted:dismissed", "1"); setShowGettingStarted(false); }}>
              Dismiss
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {([
              { href: "/app/settings/routines", label: "Set your Core habits", emoji: "⚡" },
              { href: "/app/settings/modules", label: "Choose your tabs", emoji: "📱" },
              { href: "/app/settings/appearance", label: "Pick a theme", emoji: "🎨" },
            ]).map(({ href, label, emoji }) => (
              <Link key={href} href={href} className="card-interactive flex items-center gap-3 px-4 py-3"
                onClick={() => hapticLight()}>
                <span className="text-lg">{emoji}</span>
                <span className="flex-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</span>
                <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Routines</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{format(today, "EEEE, MMM d")}</p>
      </header>

      {/* ── WEEK OVERVIEW ── */}
      <section className="card p-5">
        <div className="flex items-center gap-5 mb-4">
          <ProgressRing progress={score} size={72} strokeWidth={6} subtitle={allCoreDone ? "✓" : undefined} />
          <div className="flex-1">
            <p className="text-base font-bold" style={{ color: allCoreDone ? "var(--accent-green-text)" : "var(--text-primary)" }}>
              {allCoreDone ? "Green day!" : `${coreDone}/${coreTotal} core`}
            </p>
            {!streaks.loading && streaks.currentStreak > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className={streaks.currentStreak >= 3 ? "animate-streak-glow" : ""} style={{ fontSize: "13px" }}>🔥</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{streaks.currentStreak}</span>
                <span className="text-xs" style={{ color: "var(--text-faint)" }}>day streak</span>
              </div>
            )}
          </div>
        </div>

        <WeekStrip days={last7WithToday} />

        {/* Quick stats */}
        {!streaks.loading && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl px-3 py-2" style={{ background: "var(--bg-card-hover)" }}>
              <p className="text-[10px] font-bold tracking-wider" style={{ color: "var(--text-faint)" }}>WEEKLY HIT</p>
              <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {streaks.coreHitRateThisWeek === null ? "—" : `${streaks.coreHitRateThisWeek}%`}
              </p>
            </div>
            <div className="rounded-xl px-3 py-2" style={{ background: "var(--bg-card-hover)" }}>
              <p className="text-[10px] font-bold tracking-wider" style={{ color: "var(--text-faint)" }}>GREEN DAYS</p>
              <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{streaks.greenDaysThisMonth}</p>
            </div>
          </div>
        )}
      </section>

      {/* ── QUICK LINKS ── */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/app/routines/progress" className="card-interactive flex flex-col items-center gap-2 p-4 text-center"
          onClick={() => hapticLight()}>
          <span className="text-xl">📊</span>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Progress</span>
          <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>Calendar + stats</span>
        </Link>
        <Link href={`/app/routines/edit/${dateKey}`} className="card-interactive flex flex-col items-center gap-2 p-4 text-center"
          onClick={() => hapticLight()}>
          <span className="text-xl">✏️</span>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Edit today</span>
          <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>Fix past entries</span>
        </Link>
      </div>

      {/* ── ALL HABITS ── */}
      <section>
        <p className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: "var(--text-muted)" }}>All habits</p>
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

      {routine.isFallback && <p className="text-center text-xs" style={{ color: "var(--text-faint)" }}>Nothing scheduled — showing core habits.</p>}
    </div>
  );
}
