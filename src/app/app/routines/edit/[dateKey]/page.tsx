"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { format, parseISO } from "date-fns";

import { useRoutineDay, usePersist } from "@/lib/hooks";
import { RoutineCheckItem, SkeletonCard, SkeletonLine, Toast, ConfettiBurst } from "@/app/app/_components/ui";
import { hapticLight, hapticHeavy, hapticSuccess } from "@/lib/haptics";
import type { DayMode } from "@/lib/types";

export default function EditDayPage() {
  const params = useParams<{ dateKey: string }>();
  const router = useRouter();
  const dateKey = params.dateKey;

  const routine = useRoutineDay(dateKey);
  const { saveState, debouncedPersist, flushNow } = usePersist({ dateKey, itemsRef: routine.itemsRef });

  const [dayMode, setDayMode] = useState(routine.dayMode);
  const [items, setItems] = useState(routine.items);
  const [confettiTrigger, setConfettiTrigger] = useState(false);

  useEffect(() => { setItems(routine.items); setDayMode(routine.dayMode); }, [routine.loading]); // eslint-disable-line
  useEffect(() => { routine.itemsRef.current = items; }, [items, routine.itemsRef]);

  const coreItems = useMemo(() => items.filter((i) => i.isNonNegotiable), [items]);
  const coreDone = coreItems.filter((i) => i.done).length;
  const allCoreDone = coreItems.length > 0 && coreDone === coreItems.length;

  const toggleItem = useCallback((id: string) => {
    setItems((prev) => { const next = prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)); routine.itemsRef.current = next; return next; });
    debouncedPersist(dayMode);
  }, [dayMode, debouncedPersist, routine.itemsRef]);

  const markAllCoreDone = useCallback(() => {
    setItems((prev) => { const next = prev.map((i) => (i.isNonNegotiable ? { ...i, done: true } : i)); routine.itemsRef.current = next; return next; });
    hapticHeavy();
    setConfettiTrigger(true);
    setTimeout(() => setConfettiTrigger(false), 100);
    debouncedPersist(dayMode);
  }, [dayMode, debouncedPersist, routine.itemsRef]);

  useEffect(() => { if (allCoreDone && coreDone > 0) { setConfettiTrigger(true); setTimeout(() => setConfettiTrigger(false), 100); } }, [allCoreDone, coreDone]);

  // Format the date nicely
  let dateLabel = dateKey;
  try { dateLabel = format(parseISO(dateKey), "EEEE, MMM d"); } catch { /* keep raw */ }

  if (routine.loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <header className="space-y-2">
          <button className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-muted)" }}
            onClick={() => router.back()} type="button"><ArrowLeft size={16} /> Back</button>
          <SkeletonLine width="180px" height="28px" />
        </header>
        <SkeletonCard lines={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfettiBurst trigger={confettiTrigger} />
      <Toast state={saveState} />

      <header className="space-y-2">
        <button className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: "var(--text-muted)" }}
          onClick={() => { hapticLight(); router.back(); }} type="button">
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Edit day</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{dateLabel}</p>
        </div>
      </header>

      {/* Day mode */}
      <section>
        <p className="text-xs font-bold tracking-wider uppercase mb-2 px-1" style={{ color: "var(--text-faint)" }}>Day mode</p>
        <div className="rounded-2xl p-1 flex gap-1" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          {(["normal", "travel", "sick"] as const).map((mode) => (
            <button key={mode} type="button"
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-center transition-all duration-200 capitalize"
              style={{
                background: dayMode === mode ? "var(--btn-primary-bg)" : "transparent",
                color: dayMode === mode ? "var(--btn-primary-text)" : "var(--text-muted)",
              }}
              onClick={() => { setDayMode(mode); hapticLight(); debouncedPersist(mode); }}>
              {mode}
            </button>
          ))}
        </div>
      </section>

      {/* Checklist */}
      <section>
        <div className="flex items-center justify-between gap-2 mb-3 px-1">
          <p className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
            Checklist
          </p>
          {!allCoreDone && coreItems.length > 0 && (
            <button type="button" className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
              style={{ background: "var(--bg-card-hover)", color: "var(--text-muted)" }}
              onClick={markAllCoreDone}>
              Mark all core done
            </button>
          )}
        </div>

        <div className="space-y-2 stagger-children">
          {items.map((item) => (
            <RoutineCheckItem key={item.id} id={item.id} label={item.label} emoji={item.emoji}
              isCore={item.isNonNegotiable} done={item.done} onToggle={toggleItem} compact />
          ))}
        </div>
      </section>

      {/* Save bar */}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="btn-primary text-sm flex items-center justify-center gap-2"
          onClick={() => { hapticSuccess(); flushNow(dayMode); }}>
          <Check size={16} /> Save
        </button>
        <button type="button" className="btn-secondary text-sm"
          onClick={() => { hapticLight(); router.back(); }}>
          Done
        </button>
      </div>
    </div>
  );
}
