"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { createRoutineItem, createRoutineItemsBulk, listRoutineItems } from "@/lib/supabaseData";
import { Toast, SubPageHeader, type ToastState } from "@/app/app/_components/ui";

type LibraryItem = { label: string; emoji?: string; section?: "morning" | "anytime" | "night"; suggestedCore?: boolean };

const LIBRARY: Array<{ title: string; items: LibraryItem[] }> = [
  {
    title: "Basics",
    items: [
      { label: "Drink water", emoji: "💧", section: "morning", suggestedCore: true },
      { label: "Morning sunlight", emoji: "🌅", section: "morning" },
      { label: "Walk", emoji: "🚶", section: "anytime", suggestedCore: true },
      { label: "Protein", emoji: "🍳", section: "anytime" },
      { label: "Sleep by target time", emoji: "😴", section: "night", suggestedCore: true },
    ],
  },
  {
    title: "Mind & Focus",
    items: [
      { label: "Breathwork / meditation", emoji: "🌬️", section: "morning" },
      { label: "Journal", emoji: "📓", section: "morning" },
      { label: "Deep work (30 min)", emoji: "🎯", section: "anytime", suggestedCore: true },
      { label: "Inbox once", emoji: "📥", section: "anytime" },
      { label: "Shutdown ritual", emoji: "🌙", section: "night" },
    ],
  },
  {
    title: "Fitness",
    items: [
      { label: "Workout", emoji: "🏋️", section: "anytime", suggestedCore: true },
      { label: "Stretch", emoji: "🧘", section: "night" },
      { label: "Mobility (10 min)", emoji: "🧘", section: "anytime" },
    ],
  },
];

export default function RoutineLibraryPage() {
  const [toast, setToast] = useState<ToastState>("idle");
  const [toastMsg, setToastMsg] = useState("");
  const [query, setQuery] = useState("");
  const [addingKey, setAddingKey] = useState("");

  const flat = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = LIBRARY.flatMap((g) => g.items);
    if (!q) return all;
    return all.filter((i) => (i.label ?? "").toLowerCase().includes(q));
  }, [query]);

  const show = (state: ToastState, msg?: string) => {
    setToast(state); setToastMsg(msg ?? "");
    if (state === "saved" || state === "error") setTimeout(() => setToast("idle"), 1500);
  };

  const addOne = async (it: LibraryItem) => {
    setAddingKey(it.label); show("saving");
    try {
      const existing = await listRoutineItems();
      if (existing.some((e) => (e.label ?? "").trim().toLowerCase() === it.label.trim().toLowerCase())) {
        show("saved", "Already in your routines.");
        return;
      }
      await createRoutineItem({ label: it.label, emoji: it.emoji ?? null, section: it.section ?? "anytime", isNonNegotiable: !!it.suggestedCore });
      show("saved", "Added.");
    } catch { show("error", "Add failed"); }
    finally { setAddingKey(""); }
  };

  const addStarterSet = async () => {
    show("saving");
    try {
      const existing = await listRoutineItems();
      const existingLabels = new Set(existing.map((e) => (e.label ?? "").trim().toLowerCase()));
      const starter: LibraryItem[] = [
        { label: "Drink water", emoji: "💧", section: "morning", suggestedCore: true },
        { label: "Walk", emoji: "🚶", section: "anytime", suggestedCore: true },
        { label: "Workout", emoji: "🏋️", section: "anytime", suggestedCore: true },
        { label: "Sleep by target time", emoji: "😴", section: "night", suggestedCore: true },
      ];
      const toAdd = starter.filter((s) => !existingLabels.has(s.label.trim().toLowerCase()));
      if (toAdd.length === 0) { show("saved", "You already have the starter set."); return; }
      const maxOrder = Math.max(...existing.map((i) => i.sort_order ?? 0), 0);
      await createRoutineItemsBulk({
        items: toAdd.map((s, idx) => ({
          label: s.label, emoji: s.emoji ?? null, section: s.section ?? "anytime",
          isNonNegotiable: !!s.suggestedCore, sortOrder: maxOrder + idx + 1,
        })),
      });
      show("saved", "Starter set added.");
    } catch { show("error", "Add failed"); }
  };

  return (
    <div className="space-y-5">
      <Toast state={toast} message={toastMsg || undefined} />

      <SubPageHeader title="Routine library" subtitle="Add common habits fast"
        backHref="/app/settings/routines"
        rightAction={
          <button type="button" onClick={() => void addStarterSet()} className="btn-primary text-xs py-2 px-3">
            Starter set
          </button>
        }
      />

      <section className="card p-4">
        <label className="text-xs font-medium" style={{ color: "var(--text-faint)" }}>Search</label>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="water, walk, sleep..."
          className="mt-2 w-full rounded-xl px-3 py-3 text-sm"
          style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
      </section>

      <section className="space-y-2">
        {flat.map((it) => (
          <div key={it.label} className="card-interactive px-4 py-3 flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base">{it.emoji ?? ""}</span>
                <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>{it.label}</p>
              </div>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-faint)" }}>
                {it.section ?? "anytime"}{it.suggestedCore ? " · suggested CORE" : ""}
              </p>
            </div>
            <button type="button" disabled={addingKey === it.label} onClick={() => void addOne(it)}
              className="btn-primary text-xs py-2 px-3 flex items-center gap-1 disabled:opacity-60">
              <Plus size={14} /> Add
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
