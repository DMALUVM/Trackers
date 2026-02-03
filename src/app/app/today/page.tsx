"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle2, Circle, Zap } from "lucide-react";
import type { DayMode, RoutineItemRow } from "@/lib/types";
import {
  listRoutineItems,
  loadDayState,
  toDateKey,
  upsertDailyChecks,
} from "@/lib/supabaseData";
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
  const today = useMemo(() => new Date(), []);
  const dateKey = useMemo(() => toDateKey(today), [today]);

  const [dayMode, setDayMode] = useState<DayMode>("normal");
  const [items, setItems] = useState<UiItem[]>([]);
  const itemsRef = useRef<UiItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [todayColor, setTodayColor] = useState<DayColor>("empty");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const routineItems = await listRoutineItems();
        if (routineItems.length === 0) {
          router.replace("/app/onboarding");
          return;
        }

        const { log, checks } = await loadDayState(dateKey);
        setDayMode(((log?.day_mode as DayMode) ?? "normal"));

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

        const tColor = computeDayColor({
          dateKey,
          routineItems,
          checks,
          log: (log as any) ?? null,
        });
        setTodayColor(tColor);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [dateKey, router, today]);

  const nextActions = useMemo(() => {
    const didRowing = items.some((i) => i.label.toLowerCase().startsWith("rowing") && i.done);
    const didWeights = items.some((i) => i.label.toLowerCase().includes("workout") && i.done);

    const missing = items.filter((i) => {
      if (!i.isNonNegotiable) return false;
      if (isWorkoutLabel(i.label)) return !(i.done || didRowing || didWeights);
      return !i.done;
    });

    return {
      missing,
      didRowing,
      didWeights,
      workoutMissing: missing.some((m) => isWorkoutLabel(m.label)),
    };
  }, [items]);

  const persistCore = async () => {
    setStatus("Saving…");
    try {
      const cur = itemsRef.current;
      await upsertDailyChecks({
        dateKey,
        checks: cur.map((i) => ({ routineItemId: i.id, done: i.done })),
      });
      setStatus("Saved.");
      setTimeout(() => setStatus(""), 1000);
    } catch (e: any) {
      setStatus(`Save failed: ${e?.message ?? String(e)}`);
    }
  };

  const toggleItem = (id: string) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
      itemsRef.current = next;
      return next;
    });
    void persistCore();
  };

  const markAllCoreDone = () => {
    setItems((prev) => {
      const next = prev.map((i) => (i.isNonNegotiable ? { ...i, done: true } : i));
      itemsRef.current = next;
      return next;
    });
    void persistCore();
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
          <Link
            href="/app/routines"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-neutral-200 hover:bg-white/15"
          >
            Full list
          </Link>
        </div>
        <p className="text-sm text-neutral-400">{headline}</p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-neutral-200">Next actions</p>
            <p className="mt-1 text-sm text-neutral-400">
              {nextActions.missing.length === 0
                ? "All Core habits done."
                : `Do ${Math.min(3, nextActions.missing.length)} thing${Math.min(3, nextActions.missing.length) === 1 ? "" : "s"} to get back on track.`}
            </p>
            {nextActions.workoutMissing ? (
              <p className="mt-1 text-xs text-neutral-500">
                Workout counts if you row or lift (or check Workout).
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black"
            onClick={markAllCoreDone}
          >
            <Zap size={14} /> Mark Core done
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {nextActions.missing.slice(0, 5).map((item) => (
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
                  <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-neutral-200">
                    CORE
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {status ? <p className="mt-3 text-xs text-neutral-400">{status}</p> : null}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs text-neutral-500">Date</p>
        <p className="mt-1 text-sm text-neutral-200">{format(today, "EEEE, MMM d")}</p>
        <p className="mt-3 text-xs text-neutral-500">Day mode</p>
        <p className="mt-1 text-sm text-neutral-200">{dayMode}</p>
      </section>
    </div>
  );
}
