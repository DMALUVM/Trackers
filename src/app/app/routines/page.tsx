"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Flame,
  Plane,
  ThermometerSnowflake,
} from "lucide-react";

type DayMode = "normal" | "travel" | "sick";

type RoutineItem = {
  id: string;
  label: string;
  done: boolean;
};

const seedItems: RoutineItem[] = [
  { id: "am-natto", label: "Morning: Nattokinase", done: false },
  {
    id: "am-lymph",
    label: "Morning: Lymphatic flow movement routine",
    done: false,
  },
  { id: "am-workout", label: "Morning: Workout", done: false },
  {
    id: "am-collagen",
    label: "Morning: Collagen + creatine",
    done: false,
  },
  { id: "any-breath", label: "Anytime: Breathwork", done: false },
  { id: "any-row", label: "Anytime: Rowing (20 min)", done: false },
  { id: "pm-mag", label: "Night: Magnesium", done: false },
];

export default function RoutinesPage() {
  const [items, setItems] = useState<RoutineItem[]>(seedItems);
  const [dayMode, setDayMode] = useState<DayMode>("normal");
  const [status, setStatus] = useState<string>("");

  const completed = useMemo(
    () => items.filter((i) => i.done).length,
    [items]
  );

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i))
    );
  };

  const save = () => {
    // Placeholder: next step will persist to Supabase.
    setStatus(`Saved. ${completed}/${items.length} complete.`);
    setTimeout(() => setStatus(""), 1500);
  };

  const cycleDayMode = () => {
    setDayMode((m) => (m === "normal" ? "travel" : m === "travel" ? "sick" : "normal"));
  };

  const dayModeLabel = dayMode === "normal" ? "Normal day" : dayMode === "travel" ? "Travel day" : "Sick day";

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Routines</h1>
        <p className="text-sm text-neutral-400">
          Tap items to check them off. (Persistence to Supabase is next.)
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-medium">Today</h2>
            <button
              className="mt-1 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-neutral-200"
              onClick={cycleDayMode}
              type="button"
            >
              {dayMode === "travel" ? <Plane size={14} /> : null}
              {dayMode === "sick" ? <ThermometerSnowflake size={14} /> : null}
              <span>{dayModeLabel}</span>
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <Flame size={16} className="text-orange-400" />
            <span>
              {completed}/{items.length}
            </span>
          </div>
        </div>

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
                  <span className={item.done ? "text-neutral-300 line-through" : ""}>
                    {item.label}
                  </span>
                </div>
                <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-neutral-300 group-hover:bg-white/15">
                  Tap
                </span>
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
            onClick={() => setItems(seedItems)}
            type="button"
          >
            Reset
          </button>
        </div>

        {status ? (
          <p className="mt-3 text-xs text-neutral-400">{status}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-medium">Progress</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Weekly, monthly, and YTD cards plus a calendar heatmap will live here.
        </p>
      </section>
    </div>
  );
}
