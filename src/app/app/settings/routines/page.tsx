"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Bell } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { createRoutineItem, listRoutineItems, updateRoutineItem } from "@/lib/supabaseData";
import type { RoutineItemRow } from "@/lib/types";
import { Toast, SubPageHeader, ReminderSheet, type ToastState } from "@/app/app/_components/ui";
import { listReminders, type Reminder } from "@/lib/reminders";
import { hapticLight } from "@/lib/haptics";

/** Simple array reorder — replaces @dnd-kit/sortable dependency */
function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function SortRow({
  item, index, total, hasReminder, onToggleNon, onArchive, onMove, onSetReminder,
}: {
  item: RoutineItemRow; index: number; total: number;
  hasReminder?: boolean;
  onToggleNon: (item: RoutineItemRow) => void;
  onArchive: (item: RoutineItemRow) => void;
  onMove: (from: number, to: number) => void;
  onSetReminder: (item: RoutineItemRow) => void;
}) {
  return (
    <div className="card-interactive p-3">
      <div className="flex items-center gap-2">
        {/* Reorder arrows */}
        <div className="flex flex-col">
          <button type="button" className="p-1 rounded-lg disabled:opacity-30"
            style={{ color: "var(--text-faint)" }}
            onClick={() => { hapticLight(); onMove(index, index - 1); }} disabled={index === 0} title="Move up">
            <ArrowUp size={14} />
          </button>
          <button type="button" className="p-1 rounded-lg disabled:opacity-30"
            style={{ color: "var(--text-faint)" }}
            onClick={() => { hapticLight(); onMove(index, index + 1); }} disabled={index === total - 1} title="Move down">
            <ArrowDown size={14} />
          </button>
        </div>

        {/* Label link */}
        <Link href={`/app/settings/routines/${item.id}`}
          className="flex-1 rounded-lg px-3 py-2 text-sm truncate"
          style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}>
          {item.label || "(untitled)"}
        </Link>

        {/* Emoji */}
        <div className="w-12 rounded-lg px-2 py-2 text-center text-sm"
          style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}>
          {item.emoji ?? ""}
        </div>

        {/* Reminder bell */}
        <button type="button" onClick={() => { hapticLight(); onSetReminder(item); }}
          className="p-2 rounded-lg" title={hasReminder ? "Edit reminder" : "Set reminder"}>
          <Bell size={16} strokeWidth={hasReminder ? 2.5 : 1.5}
            style={{ color: hasReminder ? "var(--accent-green)" : "var(--text-faint)" }} />
        </button>

        {/* Core/Opt toggle */}
        <button type="button" onClick={() => { hapticLight(); onToggleNon(item); }}
          className="rounded-full px-2 py-1.5 text-[11px] font-semibold"
          style={{
            background: item.is_non_negotiable ? "var(--accent-green-soft)" : "var(--bg-card-hover)",
            color: item.is_non_negotiable ? "var(--accent-green-text)" : "var(--text-muted)",
          }}
          title="Mark as Core habit">
          {item.is_non_negotiable ? "CORE" : "OPT"}
        </button>

        {/* Archive */}
        <button type="button" onClick={() => { hapticLight(); onArchive(item); }}
          className="p-2 rounded-lg" style={{ color: "var(--text-faint)" }} title="Archive">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

export default function RoutinesSettingsPage() {
  const [items, setItems] = useState<RoutineItemRow[]>([]);
  const [toast, setToast] = useState<ToastState>("idle");
  const [toastMsg, setToastMsg] = useState<string>("");
  const [search, setSearch] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("");

  // Reminders
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderTarget, setReminderTarget] = useState<RoutineItemRow | null>(null);
  const reminderMap = useMemo(() => {
    const m = new Map<string, Reminder>();
    for (const r of reminders) m.set(r.routine_item_id, r);
    return m;
  }, [reminders]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      (i.label ?? "").toLowerCase().includes(q) || (i.emoji ?? "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const refresh = async () => {
    const data = await listRoutineItems();
    const sorted = [...data].sort((a, b) => (a.sort_order ?? 999999) - (b.sort_order ?? 999999));
    setItems(sorted);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => { if (!cancelled) await refresh(); })();
    listReminders().then(setReminders).catch(() => {});
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { if (!cancelled) void refresh(); });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  const showToast = (state: ToastState, msg?: string) => {
    setToast(state);
    setToastMsg(msg ?? "");
    if (state === "saved" || state === "error") setTimeout(() => setToast("idle"), 1500);
  };

  const onToggleNon = async (item: RoutineItemRow) => {
    showToast("saving");
    const next = !item.is_non_negotiable;
    setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, is_non_negotiable: next } : p)));
    try {
      const daysPatch = next && Array.isArray(item.days_of_week) && item.days_of_week.length === 0 ? null : undefined;
      await updateRoutineItem(item.id, { is_non_negotiable: next, ...(daysPatch !== undefined ? { days_of_week: daysPatch } : {}) });
      showToast("saved");
    } catch { showToast("error", "Save failed"); }
  };

  const onArchive = async (item: RoutineItemRow) => {
    showToast("saving");
    try {
      await updateRoutineItem(item.id, { is_active: false });
      await refresh();
      showToast("saved");
    } catch { showToast("error", "Archive failed"); }
  };

  const onAdd = async () => {
    if (!newLabel.trim()) return;
    showToast("saving");
    try {
      const maxOrder = Math.max(...items.map((i) => i.sort_order ?? 0), 0);
      await createRoutineItem({ label: newLabel.trim(), emoji: newEmoji.trim() || null, sortOrder: maxOrder + 1 });
      setNewLabel(""); setNewEmoji("");
      await refresh();
      showToast("saved");
    } catch { showToast("error", "Add failed"); }
  };

  const persistOrder = async (next: RoutineItemRow[]) => {
    try {
      await Promise.all(next.map((it, idx) => updateRoutineItem(it.id, { sort_order: idx })));
    } catch { showToast("error", "Reorder failed"); }
  };

  const onMove = async (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = arrayMove(items, from, to);
    setItems(next);
    await persistOrder(next);
  };

  return (
    <div className="space-y-5">
      <Toast state={toast} message={toastMsg || undefined} />

      <SubPageHeader title="Routine settings" subtitle="Edit labels, mark core habits, and reorder"
        backHref="/app/settings"
        rightAction={
          <Link href="/app/settings/routines/library"
            className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5">
            <Plus size={14} /> Library
          </Link>
        }
      />

      {/* Inline help — always visible */}
      <section className="rounded-2xl p-4" style={{ background: "var(--accent-green-soft)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
        <p className="text-sm font-bold mb-2" style={{ color: "var(--accent-green-text)" }}>💡 How Core vs. Bonus works</p>
        <div className="space-y-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
          <p>Tap <span className="font-bold rounded-full px-1.5 py-0.5 text-xs" style={{ background: "var(--accent-green-soft)", color: "var(--accent-green-text)" }}>CORE</span> on a habit to make it a must-do. Complete all core habits = a <strong style={{ color: "var(--accent-green-text)" }}>green day</strong>.</p>
          <p>Habits marked <span className="font-bold rounded-full px-1.5 py-0.5 text-xs" style={{ background: "var(--bg-card-hover)", color: "var(--text-muted)" }}>OPT</span> are bonus — they count toward your total but don&apos;t affect your green day streak.</p>
          <p style={{ color: "var(--text-muted)" }}>Tip: Keep 3–5 core habits. Too many and you&apos;ll burn out!</p>
        </div>
      </section>

      <section className="card p-4 space-y-3">
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Search</label>
          <input className="mt-2 w-full rounded-xl px-3 py-3 text-sm"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
            value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search routines…" />
        </div>

        <div className="flex gap-2">
          <input className="min-w-0 flex-1 rounded-xl px-3 py-3 text-sm"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
            value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Add a routine (e.g. Journaling)" />
          <input className="w-12 shrink-0 rounded-xl px-2 py-3 text-sm text-center"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
            value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} placeholder="📝" />
          <button type="button" onClick={() => { hapticLight(); onAdd(); }} className="btn-primary shrink-0 px-3">
            <Plus size={18} />
          </button>
        </div>
      </section>

      <div className="space-y-2">
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          Tap a habit name to edit it. Use ↑↓ to reorder. Tap CORE/OPT to toggle.
        </p>
        {filteredItems.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No matches.</p>
        ) : (
          filteredItems.map((i, idx) => (
            <SortRow key={i.id} item={i} index={idx} total={filteredItems.length}
              hasReminder={reminderMap.has(i.id)}
              onToggleNon={onToggleNon} onArchive={onArchive} onMove={onMove}
              onSetReminder={setReminderTarget} />
          ))
        )}
      </div>

      {/* Reminder Sheet */}
      <ReminderSheet
        open={!!reminderTarget}
        onClose={() => setReminderTarget(null)}
        routineItemId={reminderTarget?.id ?? ""}
        routineLabel={reminderTarget?.label ?? ""}
        routineEmoji={reminderTarget?.emoji ?? undefined}
        existing={reminderTarget ? reminderMap.get(reminderTarget.id) ?? null : null}
        onSaved={() => { listReminders().then(setReminders).catch(() => {}); }}
      />
    </div>
  );
}
