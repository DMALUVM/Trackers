"use client";

// Link import removed (using router.push for navigation)
import { useEffect, useMemo, useRef, useState } from "react";
import { MetricSheet, type MetricKind } from "@/app/app/_components/MetricSheet";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO, subDays } from "date-fns";
import { Zap } from "lucide-react";
import type { DayMode, RoutineItemRow } from "@/lib/types";
import { addActivityLog, flushActivityQueue, getActivityQueueSize } from "@/lib/activity";
import { buildWeeklyQuests, greenDaysWtd, type Quest } from "@/lib/quests";
import {
  listRoutineItems,
  loadDayState,
  loadRangeStates,
  toDateKey,
  upsertDailyChecks,
  upsertDailyLog,
  upsertDaySnooze,
} from "@/lib/supabaseData";
import { supabase } from "@/lib/supabaseClient";
import { computeDayColor, isWorkoutLabel, type DayColor } from "@/lib/progress";
import { tzIsoDow } from "@/lib/time";

type UiItem = {
  id: string;
  label: string;
  emoji?: string;
  section: string;
  isNonNegotiable: boolean;
  done: boolean;
};

function shouldShow(item: RoutineItemRow, today: Date) {
  const dow = tzIsoDow(today);
  const allowed = item.days_of_week;
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(dow);
}

export default function TodayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debug = searchParams?.get("debug") === "1";
  const today = useMemo(() => new Date(), []);
  const dateKey = useMemo(() => toDateKey(today), [today]);

  const [dayMode, setDayMode] = useState<DayMode>("normal");
  const [items, setItems] = useState<UiItem[]>([]);
  const itemsRef = useRef<UiItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [todayColor, setTodayColor] = useState<DayColor>("empty");

  // Trust indicators
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [syncState, setSyncState] = useState<"synced" | "offline" | "syncing">("synced");

  const [queuedCount, setQueuedCount] = useState<number>(0);

  const saveLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? `Saved${lastSavedAt ? ` ${format(new Date(lastSavedAt), "h:mm a")}` : ""}`
        : saveState === "error"
          ? "Save failed"
          : lastSavedAt
            ? `Last saved ${format(new Date(lastSavedAt), "h:mm a")}`
            : "";

  const syncLabel =
    syncState === "syncing"
      ? `Syncing${queuedCount ? ` (${queuedCount})` : ""}…`
      : syncState === "offline"
        ? `Offline${queuedCount ? ` (${queuedCount} queued)` : ""}`
        : queuedCount
          ? `${queuedCount} queued`
          : "Synced";
  const persistTimerRef = useRef<any>(null);
  const pendingDayModeRef = useRef<DayMode | null>(null);

  // Debug counters for diagnosing iOS/PWA phantom-empty issues.
  const [dbgEmail, setDbgEmail] = useState<string>("");
  const [dbgAttempts, setDbgAttempts] = useState<number>(0);
  const [dbgRoutineCount, setDbgRoutineCount] = useState<number>(-1);
  const [dbgScheduledCount, setDbgScheduledCount] = useState<number>(-1);
  const [dbgCoreCount, setDbgCoreCount] = useState<number>(-1);

  const [snoozedUntil, setSnoozedUntil] = useState<Record<string, number>>({});
  const [last7Days, setLast7Days] = useState<Array<{ dateKey: string; color: DayColor }>>([]);
  const [streak, setStreak] = useState<{ current: number; best: number }>({ current: 0, best: 0 });
  const [categoryStreaks, setCategoryStreaks] = useState<{ movement: number; mind: number; sleep: number }>({
    movement: 0,
    mind: 0,
    sleep: 0,
  });
  const [sleepScoreToday, setSleepScoreToday] = useState<number | null>(null);

  const [streakHelp, setStreakHelp] = useState<null | "movement" | "mind" | "sleep">(null);
  const [showOptional, setShowOptional] = useState(false);
  const [recentlyDoneId, setRecentlyDoneId] = useState<string | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(true);
  const [metricOpen, setMetricOpen] = useState(false);
  const [metricKind, setMetricKind] = useState<MetricKind | null>(null);

  // Quick Log modal (Today)
  const [quickLogOpen, setQuickLogOpen] = useState(false);

  useEffect(() => {
    // Prevent background scroll when modal is open (mobile/PWA quality-of-life)
    if (typeof document === "undefined") return;
    if (!quickLogOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [quickLogOpen]);

  const setSnooze = async (routineItemId: string, untilMs: number) => {
    setSnoozedUntil((prev) => ({ ...prev, [routineItemId]: untilMs }));
    try {
      await upsertDaySnooze({ dateKey, routineItemId, snoozedUntilMs: untilMs });
    } catch {
      // If this fails (offline, auth hiccup), we still keep local UI state.
    }
  };

  useEffect(() => {
    // Sync indicator + offline queue
    const updateQueue = () => {
      setQueuedCount(getActivityQueueSize());
    };
    const doFlush = async () => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setSyncState("offline");
        updateQueue();
        return;
      }
      setSyncState("syncing");
      updateQueue();
      try {
        await flushActivityQueue();
      } finally {
        updateQueue();
        setSyncState(getActivityQueueSize() > 0 ? "offline" : "synced");
      }
    };

    updateQueue();
    setSyncState(typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "synced");

    window.addEventListener("online", doFlush);
    window.addEventListener("routines365:activityQueueChanged", updateQueue);

    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        // If auth session isn't hydrated yet (common on iOS PWA), don't treat RLS empty
        // results as "no routines".
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setDbgEmail(session?.user?.email ?? "");
        if (!session) {
          setStatus("Signing in…");
          setDbgRoutineCount(-1);
          return;
        }

        // iOS PWA can intermittently return an empty RLS result set for a moment even after
        // a session exists. Retry briefly before concluding the user has no routines.
        let attempt = 0;
        let routineItems = await listRoutineItems();
        attempt += 1;
        if (routineItems.length === 0) {
          for (const waitMs of [150, 300, 600, 900]) {
            await new Promise((r) => setTimeout(r, waitMs));
            routineItems = await listRoutineItems();
            attempt += 1;
            if (routineItems.length > 0) break;
          }
        }
        setDbgAttempts(attempt);
        setDbgRoutineCount(routineItems.length);
        setDbgCoreCount(routineItems.filter((r) => r.is_non_negotiable).length);

        if (routineItems.length === 0) {
          setStatus("Still signing in… If this persists, tap Edit routines, then come back.");
          return;
        }

        // IMPORTANT: render routines even if day-state fetch fails, otherwise Today can look empty.
        // Start with a baseline UI (done=false) and then enrich with checks/snoozes if available.
        const uiBaselineScheduled: UiItem[] = routineItems
          .filter((ri) => shouldShow(ri, today))
          .map((ri) => ({
            id: ri.id,
            label: ri.label.toLowerCase() === "sex" ? "❤️" : ri.label,
            emoji: ri.emoji ?? undefined,
            section: ri.section,
            isNonNegotiable: ri.is_non_negotiable,
            done: false,
          }));

        const uiBaselineCore: UiItem[] = routineItems
          .filter((ri) => ri.is_non_negotiable)
          .map((ri) => ({
            id: ri.id,
            label: ri.label.toLowerCase() === "sex" ? "❤️" : ri.label,
            emoji: ri.emoji ?? undefined,
            section: ri.section,
            isNonNegotiable: ri.is_non_negotiable,
            done: false,
          }));

        setDbgScheduledCount(uiBaselineScheduled.length);

        const uiBaseline = uiBaselineScheduled.length > 0 ? uiBaselineScheduled : uiBaselineCore;
        if (uiBaseline.length > 0) {
          setItems(uiBaseline);
          itemsRef.current = uiBaseline;
          setStatus(uiBaselineScheduled.length > 0 ? "" : "Nothing was scheduled for today. Showing your CORE routines.");
        }

        // Now enrich with day state (checks/snoozes/day mode). If this fails, keep baseline UI.
        try {
          const { log, checks, snoozes } = await loadDayState(dateKey);
          setDayMode(((log?.day_mode as DayMode) ?? "normal"));

          const snoozeMap: Record<string, number> = {};
          for (const s of snoozes ?? []) {
            const ms = Date.parse(s.snoozed_until);
            if (!Number.isNaN(ms)) snoozeMap[s.routine_item_id] = ms;
          }
          setSnoozedUntil(snoozeMap);

          const checkMap = new Map(checks.map((c) => [c.routine_item_id, c.done]));
          const uiScheduled: UiItem[] = uiBaselineScheduled.map((ri) => ({
            ...ri,
            done: checkMap.get(ri.id) ?? false,
          }));
          const uiCoreFallback: UiItem[] = uiBaselineCore.map((ri) => ({
            ...ri,
            done: checkMap.get(ri.id) ?? false,
          }));

          const ui = uiScheduled.length > 0 ? uiScheduled : uiCoreFallback;
          if (ui.length === 0) {
            setItems([]);
            itemsRef.current = [];
            setStatus("No routines scheduled for today. Edit your days-of-week.");
          } else {
            setItems(ui);
            itemsRef.current = ui;
            setStatus(uiScheduled.length > 0 ? "" : "Nothing was scheduled for today. Showing your CORE routines.");
          }

          const activeRoutineItems = routineItems.filter((ri) => shouldShow(ri, today));
          const tColor = computeDayColor({
            dateKey,
            routineItems: activeRoutineItems,
            checks,
            log: (log as any) ?? null,
          });
          setTodayColor(tColor);

          // Defer heavy history/quest computations until after first paint.
          setTimeout(() => {
            void (async () => {
              try {
                const from = format(subDays(today, 60), "yyyy-MM-dd");
                const hist = await loadRangeStates({ from, to: dateKey });
                const checksByDate = new Map<string, Array<{ routine_item_id: string; done: boolean }>>();
                for (const c of hist.checks) {
                  const arr = checksByDate.get(c.date) ?? [];
                  arr.push({ routine_item_id: c.routine_item_id, done: c.done });
                  checksByDate.set(c.date, arr);
                }
                const logMap = new Map<string, any>();
                for (const l of hist.logs) logMap.set(l.date, l);

                const histDays: Array<{ dateKey: string; color: DayColor }> = [];
                for (let i = 60; i >= 0; i--) {
                  const dk = format(subDays(today, i), "yyyy-MM-dd");
                  const active = routineItems.filter((ri) => shouldShow(ri, parseISO(dk)));
                  const color = computeDayColor({
                    dateKey: dk,
                    routineItems: active,
                    checks: checksByDate.get(dk) ?? [],
                    log: logMap.get(dk) ?? null,
                  });
                  histDays.push({ dateKey: dk, color });
                }

                setLast7Days(histDays.slice(-7));

                const labelById = new Map(
                  routineItems.map((ri) => [ri.id, (ri.label ?? "").toLowerCase()])
                );

                setQuestsLoading(true);
                try {
                  const g = greenDaysWtd(histDays);
                  const didKeyword = (dk: string, keywords: string[]) => {
                    const cs = checksByDate.get(dk) ?? [];
                    for (const c of cs) {
                      if (!c.done) continue;
                      const lbl = (labelById.get(c.routine_item_id) ?? "").toLowerCase();
                      if (keywords.some((k) => lbl.includes(k.toLowerCase()))) return true;
                    }
                    return false;
                  };
                  const qs = await buildWeeklyQuests({ dateKey, greenDaysWtd: g, didKeyword });
                  setQuests(qs);
                } catch {
                  setQuests([]);
                } finally {
                  setQuestsLoading(false);
                }

                const colors = histDays.map((d) => d.color);
                let current = 0;
                for (let i = colors.length - 1; i >= 0; i--) {
                  if (colors[i] !== "green") break;
                  current += 1;
                }
                let best = 0;
                let run = 0;
                for (const c of colors) {
                  if (c === "green") {
                    run += 1;
                    best = Math.max(best, run);
                  } else {
                    run = 0;
                  }
                }
                setStreak({ current, best });

                const movementKeys = ["walk", "workout", "exercise", "rowing", "stretch", "mobility", "move"];
                const mindKeys = ["breath", "meditat", "journal", "neuro", "mind"];
                const sleepKeys = ["sleep"]; // legacy routine-based sleep; replaced by sleep_score metric below

                const didCategory = (dk: string, keys: string[]) => {
                  const cs = checksByDate.get(dk) ?? [];
                  for (const c of cs) {
                    if (!c.done) continue;
                    const lbl = labelById.get(c.routine_item_id) ?? "";
                    if (keys.some((k) => lbl.includes(k))) return true;
                  }
                  const l = logMap.get(dk);
                  if (keys.includes("rowing") && l?.did_rowing) return true;
                  if ((keys.includes("workout") || keys.includes("exercise")) && l?.did_weights) return true;
                  return false;
                };

                const streakFor = (keys: string[]) => {
                  let s = 0;
                  for (let i = histDays.length - 1; i >= 0; i--) {
                    const dk = histDays[i].dateKey;
                    if (!didCategory(dk, keys)) break;
                    s += 1;
                  }
                  return s;
                };

                const sleepMinScore = 80;

          // Sleep streak: counts days where sleep score (0–100) is logged and >= 80.
          let sleepStreak = 0;
          let todayScore: number | null = null;
          try {
            const from = format(subDays(today, 120), "yyyy-MM-dd");
            const { data: sleepRows } = await supabase
              .from("activity_logs")
              .select("date,value")
              .eq("activity_key", "sleep_score")
              .eq("unit", "score")
              .gte("date", from)
              .lte("date", dateKey)
              .order("date", { ascending: false });

            const scoreByDate = new Map<string, number>();
            for (const r of (sleepRows ?? []) as any[]) {
              const dk = String(r.date);
              const v = Number(r.value);
              if (!Number.isFinite(v)) continue;
              // keep max per day if multiple entries
              const cur = scoreByDate.get(dk);
              if (cur == null || v > cur) scoreByDate.set(dk, v);
            }

            todayScore = scoreByDate.get(dateKey) ?? null;

            // consecutive days ending today
            for (let i = 0; i < 121; i++) {
              const dk = format(subDays(today, i), "yyyy-MM-dd");
              const v = scoreByDate.get(dk);
              if (v == null || v < sleepMinScore) break;
              sleepStreak += 1;
            }
          } catch {
            // ignore; keep default sleep streak
          }

          setSleepScoreToday(todayScore);

          setCategoryStreaks({
            movement: streakFor(movementKeys),
            mind: streakFor(mindKeys),
            sleep: sleepStreak,
          });
              } catch {
                // ignore
              }
            })();
          }, 0);
        } catch (e: any) {
          // Keep baseline routines visible; just surface a quiet status in debug.
          if (debug) setStatus(`Day state load failed: ${e?.message ?? String(e)}`);
        }
      } finally {
        setLoading(false);
      }
    };

    void run();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // iOS PWA often hydrates the session slightly after first paint.
      void run();
    });

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void run();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", doFlush);
      window.removeEventListener("routines365:activityQueueChanged", updateQueue);
    };
  }, [dateKey, router, today]);

  const nextActions = useMemo(() => {
    const now = Date.now();
    const didRowing = items.some((i) => i.label.toLowerCase().startsWith("rowing") && i.done);
    const didWeights = items.some((i) => i.label.toLowerCase().includes("workout") && i.done);

    const core = items.filter((i) => i.isNonNegotiable);
    const optional = items.filter((i) => !i.isNonNegotiable);

    const missingCore = core.filter((i) => {
      if (snoozedUntil[i.id] && snoozedUntil[i.id] > now) return false;
      if (isWorkoutLabel(i.label)) return !(i.done || didRowing || didWeights);
      return !i.done;
    });

    const coreTotal = core.length;
    const coreDone = core.filter((i) => i.done).length;
    const score = coreTotal === 0 ? 0 : Math.round((coreDone / coreTotal) * 100);

    // Bonus: reward optional completion without diluting CORE
    const bonusDone = optional.filter((i) => i.done).length;

    // Immediate color: based on today's scheduled CORE only (what's on-screen).
    const immediateColor: DayColor =
      coreTotal === 0 ? "empty" : missingCore.length === 0 ? "green" : missingCore.length === 1 ? "yellow" : "red";

    return {
      core,
      optional,
      missingCore,
      didRowing,
      didWeights,
      workoutMissing: missingCore.some((m) => isWorkoutLabel(m.label)),
      coreTotal,
      coreDone,
      score,
      bonusDone,
      immediateColor,
    };
  }, [items, snoozedUntil]);

  const persistNow = async (opts?: { dayMode?: DayMode }) => {
    try {
      const cur = itemsRef.current;
      const nextMode = opts?.dayMode ?? pendingDayModeRef.current ?? dayMode;
      pendingDayModeRef.current = null;

      const didRowing = cur.some((i) => i.label.toLowerCase().startsWith("rowing") && i.done);
      const didWeights = cur.some((i) => i.label.toLowerCase().includes("workout") && i.done);
      const sex = cur.some((i) => i.label.toLowerCase() === "sex" && i.done);

      await Promise.all([
        upsertDailyLog({
          dateKey,
          dayMode: nextMode,
          sex,
          didRowing,
          didWeights,
        }),
        upsertDailyChecks({
          dateKey,
          checks: cur.map((i) => ({ routineItemId: i.id, done: i.done })),
        }),
      ]);

      setStatus("Saved.");
      setSaveState("saved");
      setLastSavedAt(Date.now());
      setTimeout(() => {
        setStatus("");
        setSaveState("idle");
      }, 1200);
    } catch (e: any) {
      setStatus(`Save failed: ${e?.message ?? String(e)}`);
      setSaveState("error");
    }
  };

  const persist = (opts?: { dayMode?: DayMode }) => {
    setStatus("Saving…");
    setSaveState("saving");
    if (opts?.dayMode) pendingDayModeRef.current = opts.dayMode;

    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      void persistNow();
    }, 250);
  };

  const toggleItem = (id: string) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
      itemsRef.current = next;
      return next;
    });
    persist();
  };

  const markDone = (id: string) => {
    setRecentlyDoneId(id);
    try {
      // Haptics (best-effort)
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        // @ts-ignore
        navigator.vibrate(12);
      }
    } catch {
      // ignore
    }

    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, done: true } : i));
      itemsRef.current = next;
      return next;
    });

    // Autopilot: move the next missing CORE into view
    setTimeout(() => {
      try {
        const now = Date.now();
        const cur = itemsRef.current;
        const didRowing = cur.some((i) => i.label.toLowerCase().startsWith("rowing") && i.done);
        const didWeights = cur.some((i) => i.label.toLowerCase().includes("workout") && i.done);
        const missing = cur.filter((i) => i.isNonNegotiable).filter((i) => {
          if (snoozedUntil[i.id] && snoozedUntil[i.id] > now) return false;
          if (isWorkoutLabel(i.label)) return !(i.done || didRowing || didWeights);
          return !i.done;
        });
        const nextId = missing[0]?.id;
        if (nextId) {
          const el = document.getElementById(`ri-${nextId}`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } catch {
        // ignore
      }
    }, 60);

    persist();
    setTimeout(() => setRecentlyDoneId(null), 500);
  };

  const markAllCoreDone = () => {
    setRecentlyDoneId("__all_core__");
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        // @ts-ignore
        navigator.vibrate([10, 20, 10]);
      }
    } catch {
      // ignore
    }

    setItems((prev) => {
      const next = prev.map((i) => (i.isNonNegotiable ? { ...i, done: true } : i));
      itemsRef.current = next;
      return next;
    });
    persist();
    setTimeout(() => setRecentlyDoneId(null), 600);
  };

  const logMetric = (item: UiItem) => {
    const label = (item.label ?? "").toLowerCase();

    const kind: MetricKind | null = label.includes("rowing")
      ? { key: "rowing", title: "Rowing", emoji: "🚣" }
      : label.includes("sauna")
        ? { key: "sauna", title: "Sauna", emoji: "🔥" }
        : label.includes("cold")
          ? { key: "cold", title: "Cold plunge", emoji: "❄️" }
          : label.includes("walk")
            ? { key: "walking", title: "Walking", emoji: "🚶" }
            : label.includes("run")
              ? { key: "running", title: "Running", emoji: "🏃" }
              : null;

    if (!kind) {
      setStatus("No metric attached to this routine yet.");
      setTimeout(() => setStatus(""), 1200);
      return;
    }

    setMetricKind(kind);
    setMetricOpen(true);
  };

  const skipAllOptionalToday = () => {
    const until = Date.now() + 24 * 60 * 60 * 1000;
    for (const it of itemsRef.current) {
      if (it.isNonNegotiable) continue;
      void setSnooze(it.id, until);
    }
  };

  // Make the color/label feel instant: update local day color from the current on-screen CORE state.
  useEffect(() => {
    setTodayColor(nextActions.immediateColor);
    setLast7Days((prev) => {
      if (!prev || prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last.dateKey !== dateKey) return prev;
      const next = [...prev];
      next[next.length - 1] = { ...last, color: nextActions.immediateColor };
      return next;
    });
  }, [dateKey, nextActions.immediateColor]);

  const showLoading = loading && items.length === 0;

  const headline = showLoading
    ? "Loading…"
    : todayColor === "green"
      ? "Green day. Lock it in."
      : todayColor === "yellow"
        ? "Close. One core miss."
        : todayColor === "red"
          ? "Red so far. Fixable today."
          : "";

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Today</h1>
          <button
            type="button"
            onClick={() => router.push("/app/settings/routines")}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-neutral-200 hover:bg-white/15"
          >
            Edit routines
          </button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-400">{headline}</p>
          <div className="text-right">
            <p
              className={
                "text-xs " +
                (saveState === "saving"
                  ? "text-neutral-300"
                  : saveState === "saved"
                    ? "text-emerald-300"
                    : saveState === "error"
                      ? "text-rose-300"
                      : "text-neutral-500")
              }
            >
              {saveLabel}
            </p>
            <p className="text-[10px] text-neutral-500">{syncLabel}</p>
          </div>
        </div>

        {debug ? (
          <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-neutral-300">
            <div className="font-semibold text-neutral-200">Debug</div>
            <div>Email: {dbgEmail || "(none)"}</div>
            <div>Attempts: {dbgAttempts}</div>
            <div>Routine count: {dbgRoutineCount}</div>
            <div>CORE count: {dbgCoreCount}</div>
            <div>Scheduled today: {dbgScheduledCount}</div>
            <div>Status: {status || "(none)"}</div>
          </div>
        ) : null}
      </header>

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
                <p className="mt-1 text-sm text-neutral-400">Knock out Core habits fast.</p>
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
                <p className="text-sm text-neutral-300">No Core habits yet. Set them first.</p>
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
                            <span
                              className={
                                "inline-flex h-5 w-5 items-center justify-center rounded-full border " +
                                (item.done ? "border-emerald-500 bg-emerald-500/20" : "border-white/15")
                              }
                            >
                              {item.done ? "✓" : ""}
                            </span>
                            <span className="text-base">{item.emoji ?? ""}</span>
                            <span className={item.done ? "text-neutral-300 line-through" : ""}>{item.label}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                onClick={() => {
                  // "Smart" mark-all: if the user already did rowing or weights,
                  // don't force them to also manually check Workout.
                  const cur = itemsRef.current;
                  const didRowing = cur.some((i) => i.label.toLowerCase().startsWith("rowing") && i.done);
                  const didWeights = cur.some((i) => i.label.toLowerCase().includes("workout") && i.done);

                  setItems((prev) => {
                    const next = prev.map((i) => {
                      if (!i.isNonNegotiable) return i;
                      if (i.done) return i;
                      if (isWorkoutLabel(i.label) && (didRowing || didWeights)) return i;
                      return { ...i, done: true };
                    });
                    itemsRef.current = next;
                    return next;
                  });
                  persist();
                  setQuickLogOpen(false);
                }}
              >
                Mark all Core done
              </button>
              <button
                type="button"
                className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90"
                onClick={() => {
                  setQuickLogOpen(false);
                  router.push("/app/settings/routines");
                }}
              >
                Edit Core habits
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-500">Daily score</p>
          <div className="text-xs text-neutral-400">
            <span className="font-semibold text-neutral-200">Streak:</span> {streak.current} &nbsp;|&nbsp; Best: {streak.best}
          </div>
        </div>
        <div className="mt-2 flex items-end justify-between">
          <p className="text-4xl font-semibold tracking-tight">{nextActions.score}</p>
          <div className="text-right">
            <p className="text-sm text-neutral-400">
              Core: {nextActions.coreDone}/{nextActions.coreTotal}
            </p>
            <p className="text-xs text-neutral-500">Bonus: +{nextActions.bonusDone}</p>
          </div>
        </div>
        {nextActions.missingCore.length > 0 ? (
          <>
            <p className="mt-2 text-sm text-neutral-300">
              Do <b>{Math.min(1, nextActions.missingCore.length)}</b> more Core habit to improve your score.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {nextActions.missingCore.slice(0, 3).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => markDone(m.id)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-100 hover:bg-white/10"
                >
                  {m.emoji ? `${m.emoji} ` : ""}{m.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setQuickLogOpen(true)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-white/10"
              >
                Quick Log
              </button>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-neutral-300">
            All Core habits done. {nextActions.bonusDone > 0 ? `Bonus done: +${nextActions.bonusDone}.` : "Keep it simple."}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {([
            {
              key: "movement",
              emoji: "🚶",
              label: "Movement",
              val: categoryStreaks.movement,
              help: "Counts: walk, workout, exercise, rowing, stretch, mobility, move",
            },
            {
              key: "mind",
              emoji: "🧠",
              label: "Mind",
              val: categoryStreaks.mind,
              help: "Counts: breathwork, meditation, journal, neuro",
            },
            {
              key: "sleep",
              emoji: "😴",
              label: "Sleep",
              val: categoryStreaks.sleep,
              help: "Counts: sleep",
            },
          ] as const).map((x) => {
            const tone = x.val === 0 ? "bg-white/10 text-neutral-300" : x.val < 3 ? "bg-yellow-400/15 text-yellow-200" : "bg-emerald-500/15 text-emerald-200";
            const active = streakHelp === x.key;
            return (
              <button
                key={x.key}
                type="button"
                onClick={() => {
                  if (x.key === "sleep") {
                    setMetricKind({ key: "sleep", title: "Sleep score", emoji: "😴" });
                    setMetricOpen(true);
                    return;
                  }
                  setStreakHelp((cur) => (cur === x.key ? null : x.key));
                }}
                className={
                  "rounded-full px-3 py-2 text-[12px] font-semibold transition " +
                  tone +
                  (active ? " ring-2 ring-white/15" : "")
                }
                title="Tap to see what counts"
              >
                <span className="mr-2">{x.emoji}</span>
                <span className="mr-2">{x.key === "sleep" && sleepScoreToday != null ? sleepScoreToday : x.val}</span>
                <span className="text-[10px] opacity-70">{x.label}</span>
              </button>
            );
          })}
        </div>

        {streakHelp ? (
          <div className="mt-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-neutral-300">
            {streakHelp === "movement"
              ? "🚶 Movement streak: Counts if you complete any movement habit that day (walk, workout, exercise, rowing, stretch, mobility, move)."
              : streakHelp === "mind"
                ? "🧠 Mind streak: Counts if you complete breathwork/meditation, journaling, or anything with neuro in the label."
                : `😴 Sleep streak: Counts if you log a sleep score ≥ 80 (Oura/Eight Sleep). ${sleepScoreToday != null ? `Today: ${sleepScoreToday}` : "Tap to log today."}`}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-neutral-200">This week</p>
          <p className="text-xs text-neutral-500">Quests</p>
        </div>

        {questsLoading ? (
          <p className="mt-2 text-sm text-neutral-400">Loading quests…</p>
        ) : quests.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No quests selected.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {quests.map((q) => (
              <div key={q.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      <span className="mr-2">{q.emoji}</span>
                      {q.title}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-400">{q.desc}</p>
                  </div>
                  <p className="text-xs font-semibold text-neutral-200">{q.pct}%</p>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(100, Math.max(0, q.pct))}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-neutral-300">{q.progressText}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-neutral-200">Last 7 days</p>
          <a className="text-xs text-neutral-400 underline" href="/app/routines/progress">
            View progress
          </a>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {last7Days.length === 0 ? (
            <p className="text-xs text-neutral-500">Building your history…</p>
          ) : (
            last7Days.map((d) => {
              const cls =
                d.color === "green"
                  ? "bg-emerald-500"
                  : d.color === "yellow"
                    ? "bg-yellow-400"
                    : d.color === "red"
                      ? "bg-rose-500"
                      : "bg-white/10";
              return (
                <button
                  key={d.dateKey}
                  type="button"
                  onClick={() => router.push(`/app/routines/edit/${d.dateKey}`)}
                  className="flex flex-col items-center gap-1"
                  title="Edit this day"
                >
                  <div className={`h-3 w-7 rounded-full ${cls}`} />
                  <div className="text-[10px] text-neutral-500">{d.dateKey.slice(8)}</div>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-neutral-200">Next actions</p>
            <p className="mt-1 text-sm text-neutral-400">
              {items.length === 0
                ? "No items scheduled for today."
                : nextActions.missingCore.length === 0
                  ? "All Core habits done."
                  : `Do ${Math.min(3, nextActions.missingCore.length)} thing${Math.min(3, nextActions.missingCore.length) === 1 ? "" : "s"} to get back on track.`}
            </p>
            {items.length === 0 ? (
              <p className="mt-1 text-xs text-neutral-500">
                Tip: open the full list and assign days-of-week to at least one item.
              </p>
            ) : nextActions.workoutMissing ? (
              <p className="mt-1 text-xs text-neutral-500">
                Workout counts if you row or lift (or check Workout).
              </p>
            ) : null}
          </div>
          {items.length > 0 ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black"
                onClick={markAllCoreDone}
              >
                <Zap size={14} /> Complete all CORE
              </button>
              {nextActions.optional.length > 0 ? (
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
                  onClick={skipAllOptionalToday}
                >
                  Skip all optional today
                </button>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black"
              onClick={() => router.push("/app/settings/routines")}
            >
              Edit routines
            </button>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {nextActions.missingCore.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-100"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-base">{item.emoji ?? ""}</span>
                  <span className={item.done ? "text-neutral-300 line-through" : ""}>
                    {item.label}
                  </span>
                  <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-neutral-200">
                    CORE
                  </span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="rounded-xl bg-white px-3 py-3 text-sm font-semibold text-black"
                  onClick={() => markDone(item.id)}
                >
                  Completed
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-white hover:bg-white/10"
                  onClick={() => {
                    // "Skip" means: hide this item for today.
                    void setSnooze(item.id, Date.now() + 24 * 60 * 60 * 1000);
                  }}
                >
                  Skip today
                </button>
              </div>
            </div>
          ))}
        </div>

        {status ? <p className="mt-3 text-xs text-neutral-400">{status}</p> : null}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-neutral-200">CORE (full list)</p>
          <p className="text-xs text-neutral-400">
            {nextActions.coreDone}/{nextActions.coreTotal} done
          </p>
        </div>

        <div className="mt-3 space-y-2">
          {nextActions.core.filter((x) => !(snoozedUntil[x.id] && snoozedUntil[x.id] > Date.now())).length === 0 ? (
            <p className="text-sm text-neutral-400">No CORE items for today.</p>
          ) : (
            nextActions.core
              .filter((x) => !(snoozedUntil[x.id] && snoozedUntil[x.id] > Date.now()))
              .map((item) => (
                <div
                  key={item.id}
                  id={`ri-${item.id}`}
                  className={
                    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-100 transition " +
                    (recentlyDoneId === item.id ? "ring-2 ring-emerald-400/60" : "")
                  }
                >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-base">{item.emoji ?? ""}</span>
                    <span className={item.done ? "text-neutral-300 line-through" : ""}>
                      {item.label}
                    </span>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-neutral-200">
                    CORE
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {item.done ? (
                    <button
                      type="button"
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-white hover:bg-white/10"
                      onClick={() => toggleItem(item.id)}
                    >
                      Undo
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rounded-xl bg-white px-3 py-3 text-sm font-semibold text-black"
                      onClick={() => markDone(item.id)}
                    >
                      Completed
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-white hover:bg-white/10"
                    onClick={() => {
                      void setSnooze(item.id, Date.now() + 24 * 60 * 60 * 1000);
                    }}
                  >
                    Skip today
                  </button>
                </div>

                <div className="mt-2">
                  <button
                    type="button"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-white/10"
                    onClick={() => logMetric(item)}
                  >
                    + Log metric
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-neutral-200">Optional</p>
          <button
            type="button"
            className="text-xs text-neutral-300 underline"
            onClick={() => setShowOptional((v) => !v)}
          >
            {showOptional ? "Hide" : "Show"}
          </button>
        </div>

        {showOptional ? (
          <div className="mt-3 space-y-2">
            {nextActions.optional.filter((x) => !(snoozedUntil[x.id] && snoozedUntil[x.id] > Date.now())).length === 0 ? (
              <p className="text-sm text-neutral-400">No optional routines.</p>
            ) : (
              nextActions.optional
                .filter((x) => !(snoozedUntil[x.id] && snoozedUntil[x.id] > Date.now()))
                .map((item) => (
                  <div
                    key={item.id}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-100"
                  >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{item.emoji ?? ""}</span>
                    <span className={item.done ? "text-neutral-300 line-through" : ""}>
                      {item.label}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {item.done ? (
                      <button
                        type="button"
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-white hover:bg-white/10"
                        onClick={() => toggleItem(item.id)}
                      >
                        Undo
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="rounded-xl bg-white px-3 py-3 text-sm font-semibold text-black"
                        onClick={() => markDone(item.id)}
                      >
                        Completed
                      </button>
                    )}
                    <button
                      type="button"
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-white hover:bg-white/10"
                      onClick={() => {
                        void setSnooze(item.id, Date.now() + 24 * 60 * 60 * 1000);
                      }}
                    >
                      Skip today
                    </button>
                  </div>

                  <div className="mt-2">
                    <button
                      type="button"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-white/10"
                      onClick={() => logMetric(item)}
                    >
                      + Log metric
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-neutral-500">Hidden. Keep Today focused.</p>
        )}
      </section>

      <MetricSheet
        open={metricOpen}
        kind={metricKind}
        onClose={() => {
          setMetricOpen(false);
          setMetricKind(null);
        }}
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
          if (metricKind.key === "sleep" && typeof p.score === "number") {
            await addActivityLog({ dateKey, activityKey: "sleep_score", value: p.score, unit: "score" });
            // update local display immediately
            setSleepScoreToday(p.score);
            return;
          }
        }}
      />

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs text-neutral-500">Date</p>
        <p className="mt-1 text-sm text-neutral-200">{format(today, "EEEE, MMM d")}</p>

        <div className="mt-4">
          <p className="text-xs text-neutral-500">Day mode</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {([
              { key: "normal", label: "Normal" },
              { key: "travel", label: "Travel" },
              { key: "sick", label: "Sick" },
            ] as const).map((opt) => {
              const active = dayMode === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  className={
                    "rounded-xl px-3 py-3 text-sm font-semibold " +
                    (active
                      ? "bg-white text-black"
                      : "border border-white/10 bg-white/5 text-white hover:bg-white/10")
                  }
                  onClick={() => {
                    const next = opt.key as DayMode;
                    if (dayMode === next) return;
                    setDayMode(next);
                    void persist({ dayMode: next });
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-neutral-500">
            Defaults to Normal each new day.
          </p>
        </div>
      </section>
    </div>
  );
}
