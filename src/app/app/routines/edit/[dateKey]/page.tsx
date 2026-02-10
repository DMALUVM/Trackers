"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Plus, Footprints, Moon, Dumbbell } from "lucide-react";
import { format, parseISO } from "date-fns";

import { useRoutineDay, usePersist } from "@/lib/hooks";
import { RoutineCheckItem, SkeletonCard, SkeletonLine, Toast, ConfettiBurst } from "@/app/app/_components/ui";
import { hapticLight, hapticHeavy, hapticSuccess, hapticMedium } from "@/lib/haptics";
import type { DayMode } from "@/lib/types";
import { addActivityLog, type ActivityKey, type ActivityUnit } from "@/lib/activity";

export default function EditDayPage() {
  const params = useParams<{ dateKey: string }>();
  const router = useRouter();
  const dateKey = params.dateKey;

  const routine = useRoutineDay(dateKey);
  const { saveState, debouncedPersist, flushNow } = usePersist({ dateKey, itemsRef: routine.itemsRef });

  const [dayMode, setDayMode] = useState(routine.dayMode);
  const [items, setItems] = useState(routine.items);
  const [confettiTrigger, setConfettiTrigger] = useState(false);

  // Activity logging for past days
  const [actSteps, setActSteps] = useState("");
  const [actSleep, setActSleep] = useState("");
  const [actSaved, setActSaved] = useState<string[]>([]);
  const [actSaving, setActSaving] = useState(false);

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

      {/* Activity Log section — log steps, sleep, etc. for this day */}
      <section>
        <p className="text-xs font-bold tracking-wider uppercase mb-3 px-1" style={{ color: "var(--text-muted)" }}>
          Activity Log
        </p>
        <div className="space-y-3">
          {/* Steps */}
          <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Footprints size={14} style={{ color: "#3b82f6" }} />
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Steps</span>
              {actSaved.includes("steps") && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--accent-green-soft)", color: "var(--accent-green-text)" }}>✓ Saved</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl px-3 py-2.5 text-sm"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                inputMode="numeric"
                type="number"
                placeholder="e.g. 8500"
                value={actSteps}
                onChange={(e) => setActSteps(e.target.value)}
              />
              <button type="button" disabled={!actSteps || actSaving}
                className="btn-primary shrink-0 px-4 py-2.5 text-sm disabled:opacity-50"
                onClick={async () => {
                  const val = parseInt(actSteps, 10);
                  if (!val || !dateKey) return;
                  setActSaving(true);
                  hapticMedium();
                  try {
                    await addActivityLog({ dateKey, activityKey: "walking" as ActivityKey, value: val, unit: "steps" as ActivityUnit });
                    setActSaved(prev => [...prev, "steps"]);
                    setActSteps("");
                  } catch { /* ignore */ }
                  setActSaving(false);
                }}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Sleep hours */}
          <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Moon size={14} style={{ color: "#8b5cf6" }} />
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Sleep</span>
              {actSaved.includes("sleep") && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--accent-green-soft)", color: "var(--accent-green-text)" }}>✓ Saved</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl px-3 py-2.5 text-sm"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                inputMode="decimal"
                type="number"
                step={0.5}
                placeholder="e.g. 7.5 hours"
                value={actSleep}
                onChange={(e) => setActSleep(e.target.value)}
              />
              <button type="button" disabled={!actSleep || actSaving}
                className="btn-primary shrink-0 px-4 py-2.5 text-sm disabled:opacity-50"
                onClick={async () => {
                  const val = parseFloat(actSleep);
                  if (!val || !dateKey) return;
                  setActSaving(true);
                  hapticMedium();
                  try {
                    await addActivityLog({ dateKey, activityKey: "sleep_hours" as ActivityKey, value: val, unit: "hours" as ActivityUnit });
                    setActSaved(prev => [...prev, "sleep"]);
                    setActSleep("");
                  } catch { /* ignore */ }
                  setActSaving(false);
                }}>
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
        <p className="text-[10px] mt-2 px-1" style={{ color: "var(--text-faint)" }}>
          Log activities you did on this day. Each save adds to your totals.
        </p>
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
