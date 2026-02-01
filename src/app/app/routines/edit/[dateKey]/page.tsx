"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  Plane,
  ThermometerSnowflake,
  ArrowLeft,
} from "lucide-react";
import type { DayMode, RoutineItemRow } from "@/lib/types";
import {
  listRoutineItems,
  loadDayState,
  upsertDailyChecks,
  upsertDailyLog,
} from "@/lib/supabaseData";
import { tzIsoDow } from "@/lib/time";

type UiItem = {
  id: string;
  label: string;
  emoji?: string;
  isNonNegotiable: boolean;
  done: boolean;
};

function labelForMode(mode: DayMode) {
  if (mode === "travel") return "Travel day";
  if (mode === "sick") return "Sick day";
  return "Normal day";
}

function shouldShow(item: RoutineItemRow, date: Date) {
  const dow = tzIsoDow(date);
  const allowed = item.days_of_week;
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(dow);
}

export default function EditDayPage() {
  const params = useParams<{ dateKey: string }>();
  const router = useRouter();
  const dateKey = params.dateKey;

  const dateObj = useMemo(() => new Date(`${dateKey}T12:00:00`), [dateKey]);

  const [loading, setLoading] = useState(true);
  const [dayMode, setDayMode] = useState<DayMode>("normal");
  const [items, setItems] = useState<UiItem[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const routineItems = await listRoutineItems();
        const { log, checks } = await loadDayState(dateKey);
        const checkMap = new Map(checks.map((c) => [c.routine_item_id, c.done]));

        const ui: UiItem[] = routineItems
          .filter((ri) => shouldShow(ri, dateObj))
          .map((ri) => ({
            id: ri.id,
            label: ri.label.toLowerCase() === "sex" ? "❤️" : ri.label,
            emoji: ri.emoji ?? undefined,
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
  }, [dateKey, dateObj]);

  const cycleDayMode = () => {
    setDayMode((m) =>
      m === "normal" ? "travel" : m === "travel" ? "sick" : "normal"
    );
  };

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i))
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
      const sex = items.some((i) => i.label === "❤️" && i.done);

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
      setTimeout(() => setStatus(""), 1200);
    } catch (e: any) {
      setStatus(`Save failed: ${e?.message ?? String(e)}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <header className="space-y-2">
          <button
            className="inline-flex items-center gap-2 text-sm text-neutral-300"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-xl font-semibold tracking-tight">Edit day</h1>
          <p className="text-sm text-neutral-400">{dateKey}</p>
        </header>
        <p className="text-sm text-neutral-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <button
          className="inline-flex items-center gap-2 text-sm text-neutral-300"
          onClick={() => router.back()}
          type="button"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Edit day</h1>
          <p className="text-sm text-neutral-400">{dateKey}</p>
        </div>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">Day mode</h2>
          <button
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-neutral-200"
            onClick={cycleDayMode}
            type="button"
          >
            {dayMode === "travel" ? <Plane size={14} /> : null}
            {dayMode === "sick" ? <ThermometerSnowflake size={14} /> : null}
            <span>{labelForMode(dayMode)}</span>
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-medium">Checklist</h2>
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
            onClick={() => router.back()}
            type="button"
          >
            Done
          </button>
        </div>

        {status ? <p className="mt-3 text-xs text-neutral-400">{status}</p> : null}
      </section>
    </div>
  );
}
