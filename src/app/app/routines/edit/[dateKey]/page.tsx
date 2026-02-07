"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { useRoutineDay, usePersist } from "@/lib/hooks";
import {
  RoutineCheckItem,
  SkeletonCard,
  SkeletonLine,
  Toast,
  ConfettiBurst,
} from "@/app/app/_components/ui";
import type { DayMode } from "@/lib/types";

export default function EditDayPage() {
  const params = useParams<{ dateKey: string }>();
  const router = useRouter();
  const dateKey = params.dateKey;

  const routine = useRoutineDay(dateKey);
  const { saveState, debouncedPersist, flushNow } = usePersist({
    dateKey,
    itemsRef: routine.itemsRef,
  });

  const [dayMode, setDayMode] = useState(routine.dayMode);
  const [items, setItems] = useState(routine.items);
  const [confettiTrigger, setConfettiTrigger] = useState(false);

  // Sync hook → local
  useEffect(() => {
    setItems(routine.items);
    setDayMode(routine.dayMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine.loading]);

  useEffect(() => { routine.itemsRef.current = items; }, [items, routine.itemsRef]);

  // Derived
  const coreItems = useMemo(() => items.filter((i) => i.isNonNegotiable), [items]);
  const coreDone = coreItems.filter((i) => i.done).length;
  const allCoreDone = coreItems.length > 0 && coreDone === coreItems.length;

  // Actions
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

  useEffect(() => {
    if (allCoreDone && coreDone > 0) {
      setConfettiTrigger(true);
      setTimeout(() => setConfettiTrigger(false), 100);
    }
  }, [allCoreDone, coreDone]);

  if (routine.loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <header className="space-y-2">
          <button className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}
            onClick={() => router.back()} type="button">
            <ArrowLeft size={16} /> Back
          </button>
          <SkeletonLine width="140px" height="24px" />
        </header>
        <SkeletonCard lines={5} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ConfettiBurst trigger={confettiTrigger} />
      <Toast state={saveState} />

      <header className="space-y-2">
        <button className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}
          onClick={() => router.back()} type="button">
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Edit day</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{dateKey}</p>
        </div>
      </header>

      {/* Day mode */}
      <section className="card p-4">
        <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>Day mode</p>
        <div className="grid grid-cols-3 gap-2">
          {(["normal", "travel", "sick"] as const).map((mode) => (
            <button key={mode} type="button"
              className={dayMode === mode ? "btn-primary text-sm py-2.5" : "btn-secondary text-sm py-2.5"}
              onClick={() => { setDayMode(mode); debouncedPersist(mode); }}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Checklist */}
      <section className="card p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-base font-medium" style={{ color: "var(--text-primary)" }}>Checklist</h2>
          {!allCoreDone && (
            <button type="button" className="btn-secondary text-xs py-1.5 px-3" onClick={markAllCoreDone}>
              Mark all Core done
            </button>
          )}
        </div>

        <div className="space-y-2 stagger-children">
          {items.map((item) => (
            <RoutineCheckItem
              key={item.id} id={item.id} label={item.label} emoji={item.emoji}
              isCore={item.isNonNegotiable} done={item.done}
              onToggle={toggleItem} compact
            />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="btn-primary text-sm" onClick={() => flushNow(dayMode)}>Save</button>
          <button type="button" className="btn-secondary text-sm" onClick={() => router.back()}>Done</button>
        </div>
      </section>
    </div>
  );
}
