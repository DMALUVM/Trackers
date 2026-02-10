"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";

import { useRoutineDay, usePersist } from "@/lib/hooks";
import { RoutineCheckItem, SkeletonCard, SkeletonLine, Toast, ConfettiBurst } from "@/app/app/_components/ui";
import { hapticLight, hapticHeavy, hapticSuccess, hapticMedium } from "@/lib/haptics";
import type { DayMode } from "@/lib/types";
import { addActivityLog, listActivityLogsForDate, type ActivityKey, type ActivityUnit, type ActivityLogRow } from "@/lib/activity";

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
  const ACTIVITIES = [
    { key: "walking", label: "Steps", emoji: "🚶", unit: "steps" as ActivityUnit, inputMode: "numeric" as const, placeholder: "8500" },
    { key: "sleep_hours", label: "Sleep", emoji: "😴", unit: "hours" as ActivityUnit, inputMode: "decimal" as const, placeholder: "7.5" },
    { key: "rowing", label: "Rowing", emoji: "🚣", unit: "meters" as ActivityUnit, inputMode: "numeric" as const, placeholder: "5000" },
    { key: "running", label: "Running", emoji: "🏃", unit: "miles" as ActivityUnit, inputMode: "decimal" as const, placeholder: "2.5" },
    { key: "hydration", label: "Water", emoji: "💧", unit: "glasses" as ActivityUnit, inputMode: "numeric" as const, placeholder: "8" },
    { key: "sauna", label: "Sauna", emoji: "🔥", unit: "sessions" as ActivityUnit, inputMode: "numeric" as const, placeholder: "1" },
    { key: "cold", label: "Cold plunge", emoji: "❄️", unit: "sessions" as ActivityUnit, inputMode: "numeric" as const, placeholder: "1" },
    { key: "meditation", label: "Meditation", emoji: "🧘", unit: "minutes" as ActivityUnit, inputMode: "numeric" as const, placeholder: "15" },
    { key: "workout", label: "Workout", emoji: "💪", unit: "minutes" as ActivityUnit, inputMode: "numeric" as const, placeholder: "45" },
  ];
  const [actValues, setActValues] = useState<Record<string, string>>({});
  const [actSaved, setActSaved] = useState<string[]>([]);
  const [actSaving, setActSaving] = useState(false);
  const [actExpanded, setActExpanded] = useState(false);
  const [existingLogs, setExistingLogs] = useState<ActivityLogRow[]>([]);

  // Load existing activity logs for this date on mount
  useEffect(() => {
    if (!dateKey) return;
    let cancelled = false;
    void (async () => {
      try {
        const logs = await listActivityLogsForDate(dateKey);
        if (cancelled) return;
        setExistingLogs(logs);
        // Mark activities that already have saved data
        const savedKeys = [...new Set(logs.map(l => l.activity_key))];
        setActSaved(savedKeys);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [dateKey]);

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

      {/* Activity Log section — log steps, sleep, rowing, etc. for this day */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
            Activity Log
          </p>
          <button type="button" onClick={() => { hapticLight(); setActExpanded(!actExpanded); }}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "var(--bg-card-hover)", color: "var(--text-muted)" }}>
            {actExpanded ? "Show less" : "Show all"}
          </button>
        </div>
        <div className="space-y-2">
          {(actExpanded ? ACTIVITIES : ACTIVITIES.slice(0, 3)).map((act) => {
            // Sum up all existing logs for this activity on this date
            const savedLogs = existingLogs.filter(l => l.activity_key === act.key);
            const savedTotal = savedLogs.reduce((sum, l) => sum + Number(l.value || 0), 0);
            const hasSaved = savedLogs.length > 0;
            return (
            <div key={act.key} className="rounded-2xl px-4 py-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
              <div className="flex items-center gap-3">
                <span className="text-base">{act.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {act.label}
                  </span>
                  {hasSaved && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold" style={{ color: "var(--accent-green-text)" }}>
                        {act.inputMode === "decimal" ? savedTotal.toFixed(1) : savedTotal} {act.unit}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "var(--accent-green-soft)", color: "var(--accent-green-text)" }}>✓ saved</span>
                    </div>
                  )}
                </div>
                <input
                  className="w-24 rounded-xl px-3 py-2 text-sm text-right"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                  inputMode={act.inputMode}
                  type="number"
                  step={act.inputMode === "decimal" ? 0.5 : 1}
                  placeholder={hasSaved ? "add more" : act.placeholder}
                  value={actValues[act.key] ?? ""}
                  onChange={(e) => setActValues(prev => ({ ...prev, [act.key]: e.target.value }))}
                />
                <button type="button"
                  disabled={!actValues[act.key] || actSaving}
                  className="shrink-0 flex items-center justify-center rounded-xl disabled:opacity-30 transition-all active:scale-90"
                  style={{ width: 38, height: 38, background: actValues[act.key] ? "var(--accent-green)" : "var(--bg-card-hover)" }}
                  onClick={async () => {
                    const raw = actValues[act.key];
                    const val = act.inputMode === "decimal" ? parseFloat(raw) : parseInt(raw, 10);
                    if (!val || !dateKey) return;
                    setActSaving(true);
                    hapticMedium();
                    try {
                      await addActivityLog({ dateKey, activityKey: act.key as ActivityKey, value: val, unit: act.unit });
                      // Refresh the existing logs to show updated total
                      const logs = await listActivityLogsForDate(dateKey);
                      setExistingLogs(logs);
                      setActSaved(prev => [...new Set([...prev, act.key])]);
                      setActValues(prev => ({ ...prev, [act.key]: "" }));
                    } catch { /* ignore */ }
                    setActSaving(false);
                  }}>
                  <Plus size={16} style={{ color: actValues[act.key] ? "var(--text-inverse)" : "var(--text-faint)" }} />
                </button>
              </div>
            </div>
            );
          })}
        </div>
        <p className="text-[10px] mt-2 px-1" style={{ color: "var(--text-faint)" }}>
          Log activities for this day. Each save adds to your totals.
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
