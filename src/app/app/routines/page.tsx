"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format, subDays, startOfMonth } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Flame,
  Plane,
  ThermometerSnowflake,
  TrendingUp,
} from "lucide-react";
import type { DayMode, DailyLogRow, RoutineItemRow } from "@/lib/types";
import {
  listRoutineItems,
  loadDayState,
  loadRangeStates,
  toDateKey,
  upsertDailyChecks,
  upsertDailyLog,
} from "@/lib/supabaseData";
import { tzIsoDow } from "@/lib/time";
import { computeDayColor, isWorkoutLabel, weekBounds, type DayColor } from "@/lib/progress";

type UiItem = {
  id: string;
  label: string;
  emoji?: string;
  section: string;
  isNonNegotiable: boolean;
  done: boolean;
};

function labelForMode(mode: DayMode) {
  if (mode === "travel") return "Travel day";
  if (mode === "sick") return "Sick day";
  return "Normal day";
}

function shouldShow(item: RoutineItemRow, today: Date) {
  const dow = tzIsoDow(today);
  const allowed = item.days_of_week;
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(dow);
}

export default function RoutinesPage() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const dateKey = useMemo(() => toDateKey(today), [today]);

  const [dayMode, setDayMode] = useState<DayMode>("normal");
  const [items, setItems] = useState<UiItem[]>([]);

  const itemsRef = useRef<UiItem[]>([]);
  const dayModeRef = useRef<DayMode>("normal");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showGettingStarted, setShowGettingStarted] = useState(false);

  const [undoSnapshot, setUndoSnapshot] = useState<UiItem[] | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);

  const autosaveTimer = useRef<number | null>(null);
  const autosaveInFlight = useRef(false);
  const autosavePending = useRef(false);

  // "Dopamine" summary on the main screen (more significant than just a checklist)
  const [coreStreak, setCoreStreak] = useState<number>(0);
  const [bestCoreStreak, setBestCoreStreak] = useState<number>(0);
  const [greenDaysThisMonth, setGreenDaysThisMonth] = useState<number>(0);
  const [last7Days, setLast7Days] = useState<Array<{ dateKey: string; color: DayColor }>>([]);
  const [coreHitRateThisWeek, setCoreHitRateThisWeek] = useState<number | null>(null);
  const [todayColor, setTodayColor] = useState<DayColor>("empty");
  const [wrapUpOpen, setWrapUpOpen] = useState(false);
  const [quickLogOpen, setQuickLogOpen] = useState(false);

  const completed = useMemo(
    () => items.filter((i) => i.done).length,
    [items]
  );

  const nextActions = useMemo(() => {
    const didRowing = items.some(
      (i) => i.label.toLowerCase().startsWith("rowing") && i.done
    );
    const didWeights = items.some(
      (i) => i.label.toLowerCase().includes("workout") && i.done
    );

    const missing = items.filter((i) => {
      if (!i.isNonNegotiable) return false;
      if (isWorkoutLabel(i.label)) {
        return !(i.done || didRowing || didWeights);
      }
      return !i.done;
    });

    const workoutMissing = missing.some((m) => isWorkoutLabel(m.label));

    return {
      missing,
      didRowing,
      didWeights,
      workoutMissing,
    };
  }, [items]);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("routines365:gettingStarted:dismissed") : "1";
    setShowGettingStarted(raw !== "1");

    const run = async () => {
      setLoading(true);
      try {
        // Prefetch Progress route for faster navigation (especially on mobile/PWA)
        router.prefetch("/app/routines/progress");

        const routineItems = await listRoutineItems();

        // Onboarding gate: new users should not inherit Dave's routines.
        if (routineItems.length === 0) {
          router.replace("/app/onboarding");
          return;
        }

        const { log, checks } = await loadDayState(dateKey);
        const checkMap = new Map(checks.map((c) => [c.routine_item_id, c.done]));

        const ui: UiItem[] = routineItems
          .filter((ri) => shouldShow(ri, today))
          .map((ri) => ({
            id: ri.id,
            label: ri.label.toLowerCase() === "sex" ? "❤️" : ri.label,
            emoji: ri.emoji ?? undefined,
            section: ri.section,
            isNonNegotiable: ri.is_non_negotiable,
            done: checkMap.get(ri.id) ?? false,
          }));

        setItems(ui);
        itemsRef.current = ui;
        const nextMode = ((log?.day_mode as DayMode) ?? "normal");
        setDayMode(nextMode);
        dayModeRef.current = nextMode;

        // Main-screen progress summary
        const coreItems = routineItems.filter((i) => i.is_non_negotiable);
        if (coreItems.length > 0) {
          // Today status color (green/yellow/red)
          const tColor = computeDayColor({
            dateKey,
            routineItems,
            checks,
            log: (log as DailyLogRow | null) ?? null,
          });
          setTodayColor(tColor);

          // Week hit-rate
          const { start, end } = weekBounds(today);
          const weekFrom = format(start, "yyyy-MM-dd");
          const weekTo = format(end, "yyyy-MM-dd");
          const week = await loadRangeStates({ from: weekFrom, to: weekTo });
          let total = 0;
          let done = 0;
          const coreIds = new Set(coreItems.map((c) => c.id));
          for (const c of week.checks) {
            if (!coreIds.has(c.routine_item_id)) continue;
            total += 1;
            if (c.done) done += 1;
          }
          setCoreHitRateThisWeek(total === 0 ? 0 : Math.round((done / total) * 100));

          // Core streak: count consecutive green days ending today (look back up to 120 days)
          const from = format(subDays(today, 120), "yyyy-MM-dd");
          const hist = await loadRangeStates({ from, to: dateKey });
          const checksByDate = new Map<string, Array<{ routine_item_id: string; done: boolean }>>();
          for (const c of hist.checks) {
            const arr = checksByDate.get(c.date) ?? [];
            arr.push({ routine_item_id: c.routine_item_id, done: c.done });
            checksByDate.set(c.date, arr);
          }
          const logMap = new Map<string, DailyLogRow>();
          for (const l of hist.logs) logMap.set(l.date, l);

          let streak = 0;
          // iterate backward from today
          const cursor = new Date(`${dateKey}T12:00:00`);
          for (let i = 0; i < 121; i++) {
            const dk = format(cursor, "yyyy-MM-dd");
            const color = computeDayColor({
              dateKey: dk,
              routineItems,
              checks: checksByDate.get(dk) ?? [],
              log: logMap.get(dk) ?? null,
            });
            if (color !== "green") break;
            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
          }
          setCoreStreak(streak);

          const colorFor = (dk: string) =>
            computeDayColor({
              dateKey: dk,
              routineItems,
              checks: checksByDate.get(dk) ?? [],
              log: logMap.get(dk) ?? null,
            });

          // Best streak (within the last ~120 days window)
          let best = 0;
          let cur = 0;
          const forward = new Date(`${from}T12:00:00`);
          for (let i = 0; i < 121; i++) {
            const dk = format(forward, "yyyy-MM-dd");
            if (colorFor(dk) === "green") {
              cur += 1;
              if (cur > best) best = cur;
            } else {
              cur = 0;
            }
            forward.setDate(forward.getDate() + 1);
          }
          setBestCoreStreak(best);

          // Green days this month (up to today)
          const mStart = startOfMonth(today);
          const mCursor = new Date(format(mStart, "yyyy-MM-dd") + "T12:00:00");
          let greenCount = 0;
          while (format(mCursor, "yyyy-MM-dd") <= dateKey) {
            if (colorFor(format(mCursor, "yyyy-MM-dd")) === "green") greenCount += 1;
            mCursor.setDate(mCursor.getDate() + 1);
          }
          setGreenDaysThisMonth(greenCount);

          // Last 7 days strip (including today)
          const last7Start = subDays(today, 6);
          const s = new Date(format(last7Start, "yyyy-MM-dd") + "T12:00:00");
          const strip: Array<{ dateKey: string; color: DayColor }> = [];
          for (let i = 0; i < 7; i++) {
            const dk = format(s, "yyyy-MM-dd");
            strip.push({ dateKey: dk, color: colorFor(dk) });
            s.setDate(s.getDate() + 1);
          }
          setLast7Days(strip);
        } else {
          setTodayColor("empty");
          setCoreHitRateThisWeek(null);
          setCoreStreak(0);
          setBestCoreStreak(0);
          setGreenDaysThisMonth(0);
          setLast7Days([]);
        }
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [dateKey, today, router]);

  const persist = async () => {
    // Serialize saves: if another save is running, mark pending.
    if (autosaveInFlight.current) {
      autosavePending.current = true;
      return;
    }

    autosaveInFlight.current = true;
    autosavePending.current = false;

    const curItems = itemsRef.current;
    const curMode = dayModeRef.current;

    setStatus("Saving…");
    try {
      const didRowing = curItems.some(
        (i) => i.label.toLowerCase().startsWith("rowing") && i.done
      );
      const didWeights = curItems.some(
        (i) => i.label.toLowerCase().includes("workout") && i.done
      );
      const sex = curItems.some((i) => i.label.toLowerCase() === "sex" && i.done);

      await upsertDailyLog({
        dateKey,
        dayMode: curMode,
        sex,
        didRowing,
        didWeights,
      });

      await upsertDailyChecks({
        dateKey,
        checks: curItems.map((i) => ({ routineItemId: i.id, done: i.done })),
      });

      setStatus("Saved.");
      setTimeout(() => setStatus(""), 1200);
    } catch (e: any) {
      setStatus(`Save failed: ${e?.message ?? String(e)}`);
    } finally {
      autosaveInFlight.current = false;
      // If changes happened while saving, immediately save again.
      if (autosavePending.current) {
        void persist();
      }
    }
  };

  const queueAutosave = () => {
    // Debounce saves while user is rapidly tapping.
    if (autosaveTimer.current) {
      window.clearTimeout(autosaveTimer.current);
    }
    autosaveTimer.current = window.setTimeout(() => {
      void persist();
    }, 800);
  };

  const toggleItem = (id: string) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
      itemsRef.current = next;
      return next;
    });
    queueAutosave();
  };

  const markAllCoreDone = () => {
    setUndoSnapshot(itemsRef.current);
    setItems((prev) => {
      const next = prev.map((i) => (i.isNonNegotiable ? { ...i, done: true } : i));
      itemsRef.current = next;
      return next;
    });
    setUndoVisible(true);
    setTimeout(() => setUndoVisible(false), 8000);
    queueAutosave();
  };

  const undo = () => {
    if (!undoSnapshot) return;
    setItems(undoSnapshot);
    itemsRef.current = undoSnapshot;
    setUndoSnapshot(null);
    setUndoVisible(false);
    queueAutosave();
  };

  const cycleDayMode = () => {
    setDayMode((m) => {
      const next = m === "normal" ? "travel" : m === "travel" ? "sick" : "normal";
      dayModeRef.current = next;
      return next;
    });
    queueAutosave();
  };

  const save = async () => {
    // Manual save fallback (also useful if autosave ever fails).
    await persist();
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Routines</h1>
          <p className="text-sm text-neutral-400">Loading…</p>
        </header>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {showGettingStarted ? (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Getting started</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Make it yours in 60 seconds. Then just tap and go.
              </p>
            </div>
            <button
              type="button"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
              onClick={() => {
                localStorage.setItem("routines365:gettingStarted:dismissed", "1");
                setShowGettingStarted(false);
              }}
            >
              Dismiss
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <a
              className="rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-black"
              href="/app/settings/routines"
            >
              Set Core habits
            </a>
            <a
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
              href="/app/settings/modules"
            >
              Choose tabs
            </a>
            <a
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
              href="/app/routines/progress"
            >
              View Progress
            </a>
            <a
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
              href="/app/settings/security"
            >
              Enable Face ID
            </a>
          </div>
        </section>
      ) : null}

      <header className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Routines</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-white/90"
              onClick={() => setQuickLogOpen(true)}
            >
              Quick Log
            </button>
            <Link
              href="/app/routines/progress"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-neutral-200 hover:bg-white/15"
            >
              <TrendingUp size={14} /> Progress
            </Link>
          </div>
        </div>
        <p className="text-sm text-neutral-400">
          Tap to check off. Save syncs to cloud.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-medium">Today’s score</h2>
            <p className="mt-1 text-sm text-neutral-400">
              {todayColor === "green"
                ? "Green day. Keep the streak alive."
                : todayColor === "yellow"
                  ? "Close. One core miss."
                  : todayColor === "red"
                    ? "Red day so far. Fixable."
                    : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-400">Core streak</p>
            <p className="mt-1 text-lg font-semibold">{coreStreak}d</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-neutral-400">Core hit-rate (this week)</p>
            <p className="mt-1 text-lg font-semibold">
              {coreHitRateThisWeek === null ? "—" : `${coreHitRateThisWeek}%`}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-neutral-400">Completion today</p>
            <p className="mt-1 text-lg font-semibold">
              {completed}/{items.length}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-neutral-200">Streaks that matter</p>
            <p className="text-[11px] text-neutral-500">G / Y / R</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-neutral-400">Best streak</p>
              <p className="mt-1 text-lg font-semibold">{bestCoreStreak}d</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-neutral-400">Green days (this month)</p>
              <p className="mt-1 text-lg font-semibold">{greenDaysThisMonth}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-neutral-400">Last 7 days</p>
            <div className="flex items-center gap-1.5">
              {last7Days.map((d) => {
                const bg =
                  d.color === "green"
                    ? "bg-emerald-500/70"
                    : d.color === "yellow"
                      ? "bg-amber-400/70"
                      : d.color === "red"
                        ? "bg-rose-500/60"
                        : "bg-white/10";
                const label =
                  d.color === "green"
                    ? "G"
                    : d.color === "yellow"
                      ? "Y"
                      : d.color === "red"
                        ? "R"
                        : "–";
                return (
                  <div
                    key={d.dateKey}
                    className={
                      "flex h-6 w-6 items-center justify-center rounded-md border border-white/10 text-[10px] font-semibold text-white " +
                      bg
                    }
                    title={d.dateKey}
                    aria-label={`${d.dateKey}: ${label}`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-neutral-200">Next actions</p>
            {todayColor !== "green" && nextActions.missing.length > 0 ? (
              <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-neutral-200">
                Get to Green: {nextActions.missing.length}
              </span>
            ) : null}
          </div>

          {nextActions.missing.length === 0 ? (
            <p className="mt-1 text-sm text-neutral-300">All Core habits are done. Lock it in.</p>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-neutral-400">
                {todayColor === "green"
                  ? `${nextActions.missing.length} Core remaining (optional)`
                  : `Do ${nextActions.missing.length} Core habit${nextActions.missing.length === 1 ? "" : "s"} to get back to Green.`}
              </p>

              {nextActions.workoutMissing ? (
                <p className="text-xs text-neutral-500">
                  Workout counts if you row or lift (or check Workout).
                </p>
              ) : null}

              <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-200">
                {nextActions.missing.slice(0, 3).map((m) => (
                  <li key={m.id}>{m.label}</li>
                ))}
              </ul>
              {nextActions.missing.length > 3 ? (
                <p className="text-xs text-neutral-500">+{nextActions.missing.length - 3} more</p>
              ) : null}
            </div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <a
            className="rounded-xl bg-white px-4 py-2.5 text-center text-sm font-semibold text-black"
            href="/app/routines/progress"
          >
            Progress
          </a>
          <Link
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-white/10"
            href={`/app/routines/edit/${dateKey}`}
          >
            Fix today
          </Link>
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-white/10"
            onClick={() => setWrapUpOpen(true)}
          >
            Wrap up
          </button>
        </div>
      </section>

      {quickLogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setQuickLogOpen(false)}
        >
          <div
            className="w-full rounded-2xl border border-white/10 bg-neutral-950 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Quick Log</h3>
                <p className="mt-1 text-sm text-neutral-400">
                  Knock out Core habits fast.
                </p>
              </div>
              <button
                type="button"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
                onClick={() => setQuickLogOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {items.filter((i) => i.isNonNegotiable).length === 0 ? (
                <p className="text-sm text-neutral-300">
                  No Core habits yet. Set them first.
                </p>
              ) : (
                <div className="space-y-2">
                  {items
                    .filter((i) => i.isNonNegotiable)
                    .map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        type="button"
                        className="group w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-neutral-100 transition-colors hover:bg-white/10"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {item.done ? (
                              <CheckCircle2 size={18} className="text-emerald-400" />
                            ) : (
                              <Circle size={18} className="text-neutral-500" />
                            )}
                            <span className="text-base">{item.emoji ?? ""}</span>
                            <span className={item.done ? "text-neutral-300 line-through" : ""}>
                              {item.label}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                  onClick={() => {
                    markAllCoreDone();
                    setQuickLogOpen(false);
                  }}
                >
                  Mark all Core done
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"
                  onClick={() => {
                    void persist();
                    setQuickLogOpen(false);
                  }}
                >
                  Save + Close
                </button>
              </div>

              {status ? <p className="mt-2 text-xs text-neutral-400">{status}</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {wrapUpOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setWrapUpOpen(false)}
        >
          <div
            className="w-full rounded-2xl border border-white/10 bg-neutral-950 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Wrap up</h3>
                <p className="mt-1 text-sm text-neutral-400">
                  Quick actions to close out today.
                </p>
              </div>
              <button
                type="button"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
                onClick={() => setWrapUpOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"
                onClick={() => {
                  markAllCoreDone();
                  setWrapUpOpen(false);
                }}
              >
                Mark all Core done
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-white hover:bg-white/10"
                  onClick={() => {
                    if (dayMode !== "travel") {
                      setDayMode("travel");
                      dayModeRef.current = "travel";
                      queueAutosave();
                    }
                    setWrapUpOpen(false);
                  }}
                >
                  Travel
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-white hover:bg-white/10"
                  onClick={() => {
                    if (dayMode !== "sick") {
                      setDayMode("sick");
                      dayModeRef.current = "sick";
                      queueAutosave();
                    }
                    setWrapUpOpen(false);
                  }}
                >
                  Sick
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-white hover:bg-white/10"
                  onClick={() => {
                    if (dayMode !== "normal") {
                      setDayMode("normal");
                      dayModeRef.current = "normal";
                      queueAutosave();
                    }
                    setWrapUpOpen(false);
                  }}
                >
                  Normal
                </button>
              </div>

              <button
                type="button"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                onClick={() => {
                  void persist();
                  setWrapUpOpen(false);
                }}
              >
                Save now
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-medium">Today</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-neutral-200"
                onClick={cycleDayMode}
                type="button"
              >
                {dayMode === "travel" ? <Plane size={14} /> : null}
                {dayMode === "sick" ? <ThermometerSnowflake size={14} /> : null}
                <span>{labelForMode(dayMode)}</span>
              </button>

              <button
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white hover:bg-white/10"
                onClick={markAllCoreDone}
                type="button"
              >
                Mark all Core done
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <Flame size={16} className="text-orange-400" />
            <span>
              {completed}/{items.length}
            </span>
          </div>
        </div>

        {undoVisible ? (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-emerald-500/10 px-3 py-2">
            <p className="text-xs text-emerald-200">Core habits marked done.</p>
            <button
              type="button"
              className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-black"
              onClick={undo}
            >
              Undo
            </button>
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              type="button"
              className="group w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-neutral-100 transition-colors hover:bg-white/10"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {item.done ? (
                    <CheckCircle2 size={18} className="text-emerald-400" />
                  ) : (
                    <Circle size={18} className="text-neutral-500" />
                  )}
                  <span className="text-base">{item.emoji ?? ""}</span>
                  <span className={item.done ? "text-neutral-300 line-through" : ""}>
                    {item.label}
                  </span>
                  {item.isNonNegotiable ? (
                    <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-neutral-200">
                      CORE
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black"
            onClick={save}
            type="button"
          >
            Save now
          </button>
          <button
            className="rounded-xl border border-white/15 bg-transparent px-4 py-2.5 text-sm font-medium text-white"
            onClick={() => window.location.reload()}
            type="button"
          >
            Refresh
          </button>
        </div>

        {status ? (
          <p className="mt-3 text-xs text-neutral-400">{status}</p>
        ) : null}
      </section>
    </div>
  );
}
