"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  Flame,
  Plane,
  ThermometerSnowflake,
  TrendingUp,
} from "lucide-react";
import type { DayMode, RoutineItemRow } from "@/lib/types";
import {
  ensureSeedData,
  listRoutineItems,
  loadDayState,
  toDateKey,
  upsertDailyChecks,
  upsertDailyLog,
} from "@/lib/supabaseData";
import { tzIsoDow } from "@/lib/time";

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
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [undoSnapshot, setUndoSnapshot] = useState<UiItem[] | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);

  const completed = useMemo(
    () => items.filter((i) => i.done).length,
    [items]
  );

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        await ensureSeedData();
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
        setDayMode((log?.day_mode as DayMode) ?? "normal");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [dateKey, today, router]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i))
    );
  };

  const markAllCoreDone = () => {
    setUndoSnapshot(items);
    setItems((prev) => prev.map((i) => (i.isNonNegotiable ? { ...i, done: true } : i)));
    setUndoVisible(true);
    setTimeout(() => setUndoVisible(false), 8000);
  };

  const undo = () => {
    if (!undoSnapshot) return;
    setItems(undoSnapshot);
    setUndoSnapshot(null);
    setUndoVisible(false);
  };

  const cycleDayMode = () => {
    setDayMode((m) =>
      m === "normal" ? "travel" : m === "travel" ? "sick" : "normal"
    );
  };

  const save = async () => {
    setStatus("Saving...");
    try {
      const didRowing = items.some(
        (i) => i.label.toLowerCase().startsWith("rowing") && i.done
      );
      const didWeights = items.some(
        (i) => i.label.toLowerCase().includes("workout") && i.done
      );
      const sex = items.some((i) => i.label.toLowerCase() === "sex" && i.done);

      await upsertDailyLog({
        dateKey,
        dayMode,
        sex,
        didRowing,
        didWeights,
      });

      await upsertDailyChecks({
        dateKey,
        checks: items.map((i) => ({ routineItemId: i.id, done: i.done })),
      });

      setStatus("Saved.");
      setTimeout(() => setStatus(""), 1500);
    } catch (e: any) {
      setStatus(`Save failed: ${e?.message ?? String(e)}`);
    }
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
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Routines</h1>
          <Link
            href="/app/routines/progress"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-neutral-200 hover:bg-white/15"
          >
            <TrendingUp size={14} /> Progress
          </Link>
        </div>
        <p className="text-sm text-neutral-400">
          Tap to check off. Save syncs to cloud.
        </p>
      </header>

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
            Save
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
