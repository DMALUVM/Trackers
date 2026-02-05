"use client";

// Link import removed (using router.push for navigation)
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, subDays } from "date-fns";
import { Zap } from "lucide-react";
import type { DayMode, RoutineItemRow } from "@/lib/types";
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

  // Debug counters for diagnosing iOS/PWA phantom-empty issues.
  const [dbgEmail, setDbgEmail] = useState<string>("");
  const [dbgAttempts, setDbgAttempts] = useState<number>(0);
  const [dbgRoutineCount, setDbgRoutineCount] = useState<number>(-1);
  const [dbgScheduledCount, setDbgScheduledCount] = useState<number>(-1);
  const [dbgCoreCount, setDbgCoreCount] = useState<number>(-1);

  const [snoozedUntil, setSnoozedUntil] = useState<Record<string, number>>({});
  const [last7Days, setLast7Days] = useState<Array<{ dateKey: string; color: DayColor }>>([]);
  const [showOptional, setShowOptional] = useState(false);

  const setSnooze = async (routineItemId: string, untilMs: number) => {
    setSnoozedUntil((prev) => ({ ...prev, [routineItemId]: untilMs }));
    try {
      await upsertDaySnooze({ dateKey, routineItemId, snoozedUntilMs: untilMs });
    } catch {
      // If this fails (offline, auth hiccup), we still keep local UI state.
    }
  };

  useEffect(() => {
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

          const tColor = computeDayColor({
            dateKey,
            routineItems,
            checks,
            log: (log as any) ?? null,
          });
          setTodayColor(tColor);

          // Last 7 days strip (uses the same color logic as Progress)
          try {
            const from = format(subDays(today, 6), "yyyy-MM-dd");
            const hist = await loadRangeStates({ from, to: dateKey });
            const checksByDate = new Map<string, Array<{ routine_item_id: string; done: boolean }>>();
            for (const c of hist.checks) {
              const arr = checksByDate.get(c.date) ?? [];
              arr.push({ routine_item_id: c.routine_item_id, done: c.done });
              checksByDate.set(c.date, arr);
            }
            const logMap = new Map<string, any>();
            for (const l of hist.logs) logMap.set(l.date, l);

            const days: Array<{ dateKey: string; color: DayColor }> = [];
            for (let i = 6; i >= 0; i--) {
              const dk = format(subDays(today, i), "yyyy-MM-dd");
              const color = computeDayColor({
                dateKey: dk,
                routineItems,
                checks: checksByDate.get(dk) ?? [],
                log: logMap.get(dk) ?? null,
              });
              days.push({ dateKey: dk, color });
            }
            setLast7Days(days);
          } catch {
            // ignore
          }
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
    };
  }, [items, snoozedUntil]);

  const persist = async (opts?: { dayMode?: DayMode }) => {
    setStatus("Saving…");
    setSaveState("saving");
    try {
      const cur = itemsRef.current;
      const nextMode = opts?.dayMode ?? dayMode;

      const didRowing = cur.some((i) => i.label.toLowerCase().startsWith("rowing") && i.done);
      const didWeights = cur.some((i) => i.label.toLowerCase().includes("workout") && i.done);
      const sex = cur.some((i) => i.label.toLowerCase() === "sex" && i.done);

      await upsertDailyLog({
        dateKey,
        dayMode: nextMode,
        sex,
        didRowing,
        didWeights,
      });

      await upsertDailyChecks({
        dateKey,
        checks: cur.map((i) => ({ routineItemId: i.id, done: i.done })),
      });

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

  const toggleItem = (id: string) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
      itemsRef.current = next;
      return next;
    });
    void persist();
  };

  const markDone = (id: string) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, done: true } : i));
      itemsRef.current = next;
      return next;
    });
    void persist();
  };

  const markAllCoreDone = () => {
    setItems((prev) => {
      const next = prev.map((i) => (i.isNonNegotiable ? { ...i, done: true } : i));
      itemsRef.current = next;
      return next;
    });
    void persist();
  };

  const skipAllOptionalToday = () => {
    const until = Date.now() + 24 * 60 * 60 * 1000;
    for (const it of itemsRef.current) {
      if (it.isNonNegotiable) continue;
      void setSnooze(it.id, until);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">Today</h1>
        <p className="text-sm text-neutral-400">Loading…</p>
      </div>
    );
  }

  const headline =
    todayColor === "green"
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
            {saveState === "saving"
              ? "Saving…"
              : saveState === "saved"
                ? `Saved${lastSavedAt ? ` ${format(new Date(lastSavedAt), "h:mm a")}` : ""}`
                : saveState === "error"
                  ? "Save failed"
                  : lastSavedAt
                    ? `Last saved ${format(new Date(lastSavedAt), "h:mm a")}`
                    : ""}
          </p>
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

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs text-neutral-500">Daily score</p>
        <div className="mt-2 flex items-end justify-between">
          <p className="text-4xl font-semibold tracking-tight">{nextActions.score}</p>
          <p className="text-sm text-neutral-400">
            Core: {nextActions.coreDone}/{nextActions.coreTotal}
          </p>
        </div>
        {nextActions.missingCore.length > 0 ? (
          <p className="mt-2 text-sm text-neutral-300">
            Do <b>{Math.min(1, nextActions.missingCore.length)}</b> more Core habit to improve your score.
          </p>
        ) : (
          <p className="mt-2 text-sm text-neutral-300">All Core habits done. Keep it simple.</p>
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
                <div key={d.dateKey} className="flex flex-col items-center gap-1">
                  <div className={`h-3 w-7 rounded-full ${cls}`} />
                  <div className="text-[10px] text-neutral-500">{d.dateKey.slice(8)}</div>
                </div>
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
          {nextActions.core.length === 0 ? (
            <p className="text-sm text-neutral-400">No CORE routines yet.</p>
          ) : (
            nextActions.core.map((item) => (
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
            {nextActions.optional.length === 0 ? (
              <p className="text-sm text-neutral-400">No optional routines.</p>
            ) : (
              nextActions.optional.map((item) => (
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
                </div>
              ))
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-neutral-500">Hidden. Keep Today focused.</p>
        )}
      </section>

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
