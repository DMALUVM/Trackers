"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Plus, Pencil, Trash2, X } from "lucide-react";
import { format, parseISO } from "date-fns";

import { useRoutineDay, usePersist } from "@/lib/hooks";
import { RoutineCheckItem, SkeletonCard, SkeletonLine, Toast, ConfettiBurst } from "@/app/app/_components/ui";
import { hapticLight, hapticHeavy, hapticSuccess, hapticMedium } from "@/lib/haptics";
import type { DayMode } from "@/lib/types";
import {
  addActivityLog,
  listActivityLogsForDate,
  deleteActivityLogsForDate,
  type ActivityKey,
  type ActivityUnit,
  type ActivityLogRow,
} from "@/lib/activity";

const ACTIVITIES = [
  { key: "walking",     label: "Steps",       emoji: "🚶", unit: "steps"    as ActivityUnit, inputMode: "numeric"  as const, placeholder: "8500" },
  { key: "sleep_hours", label: "Sleep",       emoji: "😴", unit: "hours"    as ActivityUnit, inputMode: "decimal"  as const, placeholder: "7.5" },
  { key: "rowing",      label: "Rowing",      emoji: "🚣", unit: "meters"   as ActivityUnit, inputMode: "numeric"  as const, placeholder: "5000" },
  { key: "running",     label: "Running",     emoji: "🏃", unit: "miles"    as ActivityUnit, inputMode: "decimal"  as const, placeholder: "2.5" },
  { key: "hydration",   label: "Water",       emoji: "💧", unit: "glasses"  as ActivityUnit, inputMode: "numeric"  as const, placeholder: "8" },
  { key: "sauna",       label: "Sauna",       emoji: "🔥", unit: "sessions" as ActivityUnit, inputMode: "numeric"  as const, placeholder: "1" },
  { key: "cold",        label: "Cold plunge", emoji: "❄️", unit: "sessions" as ActivityUnit, inputMode: "numeric"  as const, placeholder: "1" },
  { key: "meditation",  label: "Meditation",  emoji: "🧘", unit: "minutes"  as ActivityUnit, inputMode: "numeric"  as const, placeholder: "15" },
  { key: "workout",     label: "Workout",     emoji: "💪", unit: "minutes"  as ActivityUnit, inputMode: "numeric"  as const, placeholder: "45" },
] as const;

function formatValue(val: number, mode: "numeric" | "decimal") {
  if (mode === "decimal") return val % 1 === 0 ? val.toString() : val.toFixed(1);
  return val.toLocaleString();
}

export default function EditDayPage() {
  const params = useParams<{ dateKey: string }>();
  const router = useRouter();
  const dateKey = params.dateKey;

  const routine = useRoutineDay(dateKey);
  const { saveState, debouncedPersist, flushNow } = usePersist({ dateKey, itemsRef: routine.itemsRef });

  const [dayMode, setDayMode] = useState(routine.dayMode);
  const [items, setItems] = useState(routine.items);
  const [confettiTrigger, setConfettiTrigger] = useState(false);

  // Activity state
  const [existingLogs, setExistingLogs] = useState<ActivityLogRow[]>([]);
  const [actInput, setActInput] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [actBusy, setActBusy] = useState(false);
  const [actExpanded, setActExpanded] = useState(false);

  // Load existing activity logs
  const refreshLogs = useCallback(async () => {
    if (!dateKey) return;
    try {
      const logs = await listActivityLogsForDate(dateKey);
      setExistingLogs(logs);
    } catch { /* ignore */ }
  }, [dateKey]);

  useEffect(() => { void refreshLogs(); }, [refreshLogs]);

  // Flush pending saves when leaving the page (swipe back, switch tabs, close app)
  useEffect(() => {
    const onLeave = () => flushNow(dayMode);
    const onVisible = () => { if (document.visibilityState === "hidden") flushNow(dayMode); };
    window.addEventListener("beforeunload", onLeave);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("beforeunload", onLeave);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [dayMode, flushNow]);

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

  // Activity helpers
  const getSavedTotal = (key: string) => {
    const logs = existingLogs.filter(l => l.activity_key === key);
    return logs.reduce((sum, l) => sum + Number(l.value || 0), 0);
  };
  const hasSaved = (key: string) => existingLogs.some(l => l.activity_key === key);

  const handleSave = async (act: typeof ACTIVITIES[number]) => {
    const raw = actInput[act.key];
    const val = act.inputMode === "decimal" ? parseFloat(raw) : parseInt(raw, 10);
    if (!val || val <= 0 || !dateKey) return;
    setActBusy(true);
    hapticMedium();
    try {
      // If editing, delete old entries first then insert new value
      if (editingKey === act.key) {
        await deleteActivityLogsForDate({ dateKey, activityKey: act.key as ActivityKey });
      }
      await addActivityLog({ dateKey, activityKey: act.key as ActivityKey, value: val, unit: act.unit });
      await refreshLogs();
      setActInput(prev => ({ ...prev, [act.key]: "" }));
      setEditingKey(null);
    } catch { /* ignore */ }
    setActBusy(false);
  };

  const handleDelete = async (act: typeof ACTIVITIES[number]) => {
    if (!dateKey) return;
    setActBusy(true);
    hapticMedium();
    try {
      await deleteActivityLogsForDate({ dateKey, activityKey: act.key as ActivityKey });
      await refreshLogs();
      setEditingKey(null);
      setActInput(prev => ({ ...prev, [act.key]: "" }));
    } catch { /* ignore */ }
    setActBusy(false);
  };

  const startEdit = (act: typeof ACTIVITIES[number]) => {
    hapticLight();
    const total = getSavedTotal(act.key);
    setActInput(prev => ({ ...prev, [act.key]: total.toString() }));
    setEditingKey(act.key);
  };

  let dateLabel = dateKey;
  try { dateLabel = format(parseISO(dateKey), "EEEE, MMM d"); } catch { /* keep raw */ }

  const todayKey = new Date().toISOString().slice(0, 10);
  const isFuture = dateKey > todayKey;

  // Block editing future dates
  if (isFuture) {
    return (
      <div className="space-y-6 animate-fade-in">
        <header className="space-y-2">
          <button className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-muted)" }}
            onClick={() => router.back()} type="button"><ArrowLeft size={16} /> Back</button>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Future date</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{dateLabel}</p>
        </header>
        <div className="rounded-2xl p-5 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <p className="text-3xl mb-2">📅</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>You can only edit today and past days.</p>
        </div>
      </div>
    );
  }

  if (routine.loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <header className="space-y-2">
          <button className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-muted)" }}
            onClick={async () => { await flushNow(dayMode); router.back(); setTimeout(() => window.location.reload(), 200); }} type="button"><ArrowLeft size={16} /> Back</button>
          <SkeletonLine width="180px" height="28px" />
        </header>
        <SkeletonCard lines={5} />
      </div>
    );
  }

  const visibleActivities = actExpanded ? ACTIVITIES : ACTIVITIES.slice(0, 3);

  return (
    <div className="space-y-6">
      <ConfettiBurst trigger={confettiTrigger} />
      <Toast state={saveState} />

      <header className="space-y-2">
        <button className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: "var(--text-muted)" }}
          onClick={async () => { hapticLight(); await flushNow(dayMode); router.back(); setTimeout(() => window.location.reload(), 200); }} type="button">
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

      {/* Activity Log */}
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
          {visibleActivities.map((act) => {
            const saved = hasSaved(act.key);
            const total = getSavedTotal(act.key);
            const isEditing = editingKey === act.key;
            const showInput = !saved || isEditing;

            return (
              <div key={act.key} className="rounded-2xl px-4 py-3"
                style={{ background: "var(--bg-card)", border: `1px solid ${saved && !isEditing ? "var(--accent-green)" : "var(--border-primary)"}`,
                  ...(saved && !isEditing ? { borderColor: "rgba(16,185,129,0.25)" } : {}) }}>

                {/* Top row: emoji + label + value or input */}
                <div className="flex items-center gap-3">
                  <span className="text-lg shrink-0">{act.emoji}</span>
                  <span className="text-sm font-semibold flex-1 min-w-0" style={{ color: "var(--text-primary)" }}>
                    {act.label}
                  </span>

                  {/* Saved value (view mode) */}
                  {saved && !isEditing && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: "var(--accent-green)" }}>
                        {formatValue(total, act.inputMode)} {act.unit}
                      </span>
                      <button type="button" onClick={() => startEdit(act)}
                        className="shrink-0 flex items-center justify-center rounded-lg transition-all active:scale-90"
                        style={{ width: 32, height: 32, background: "var(--bg-card-hover)" }}>
                        <Pencil size={14} style={{ color: "var(--text-muted)" }} />
                      </button>
                    </div>
                  )}

                  {/* Input (new entry or edit mode) */}
                  {showInput && (
                    <div className="flex items-center gap-2">
                      <input
                        className="w-20 rounded-xl px-3 py-2 text-sm text-right tabular-nums"
                        style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                        inputMode={act.inputMode}
                        type="number"
                        step={act.inputMode === "decimal" ? 0.5 : 1}
                        placeholder={act.placeholder}
                        value={actInput[act.key] ?? ""}
                        onChange={(e) => setActInput(prev => ({ ...prev, [act.key]: e.target.value }))}
                        autoFocus={isEditing}
                      />
                      <button type="button"
                        disabled={!actInput[act.key] || actBusy}
                        className="shrink-0 flex items-center justify-center rounded-xl disabled:opacity-30 transition-all active:scale-90"
                        style={{ width: 36, height: 36, background: actInput[act.key] ? "var(--accent-green)" : "var(--bg-card-hover)" }}
                        onClick={() => handleSave(act)}>
                        <Check size={15} strokeWidth={2.5} style={{ color: actInput[act.key] ? "var(--text-inverse)" : "var(--text-faint)" }} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Edit mode actions row */}
                {isEditing && (
                  <div className="flex items-center justify-end gap-2 mt-2 pt-2" style={{ borderTop: "1px solid var(--border-secondary)" }}>
                    <button type="button" onClick={() => handleDelete(act)} disabled={actBusy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                      style={{ background: "var(--accent-red-soft)", color: "var(--accent-red-text)" }}>
                      <Trash2 size={12} /> Delete
                    </button>
                    <button type="button" onClick={() => { setEditingKey(null); setActInput(prev => ({ ...prev, [act.key]: "" })); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                      style={{ background: "var(--bg-card-hover)", color: "var(--text-muted)" }}>
                      <X size={12} /> Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[10px] mt-2 px-1" style={{ color: "var(--text-faint)" }}>
          Tap the pencil to edit or delete a saved entry.
        </p>
      </section>

      {/* Save bar */}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="btn-primary text-sm flex items-center justify-center gap-2"
          onClick={async () => { hapticSuccess(); await flushNow(dayMode); }}>
          <Check size={16} /> Save
        </button>
        <button type="button" className="btn-secondary text-sm"
          onClick={async () => { hapticLight(); await flushNow(dayMode); router.back(); setTimeout(() => window.location.reload(), 200); }}>
          Done
        </button>
      </div>
    </div>
  );
}
