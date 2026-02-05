"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createRoutineItem, createRoutineItemsBulk, listRoutineItems } from "@/lib/supabaseData";

type LibraryItem = {
  label: string;
  emoji?: string;
  section?: "morning" | "anytime" | "night";
  suggestedCore?: boolean;
};

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
  const [status, setStatus] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [addingKey, setAddingKey] = useState<string>("");

  const flat = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = LIBRARY.flatMap((g) => g.items);
    if (!q) return all;
    return all.filter((i) => (i.label ?? "").toLowerCase().includes(q));
  }, [query]);

  const addOne = async (it: LibraryItem) => {
    const key = it.label;
    setAddingKey(key);
    setStatus("Adding...");
    try {
      // Avoid accidental duplicates
      const existing = await listRoutineItems();
      const exists = existing.some((e) => (e.label ?? "").trim().toLowerCase() === it.label.trim().toLowerCase());
      if (exists) {
        setStatus("Already in your routines.");
        setTimeout(() => setStatus(""), 1000);
        return;
      }

      await createRoutineItem({
        label: it.label,
        emoji: it.emoji ?? null,
        section: it.section ?? "anytime",
        isNonNegotiable: !!it.suggestedCore,
      });
      setStatus("Added.");
      setTimeout(() => setStatus(""), 1000);
    } catch (e: any) {
      setStatus(`Add failed: ${e?.message ?? String(e)}`);
    } finally {
      setAddingKey("");
    }
  };

  const addStarterSet = async () => {
    setStatus("Adding starter set...");
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
      if (toAdd.length === 0) {
        setStatus("You already have the starter set.");
        setTimeout(() => setStatus(""), 1200);
        return;
      }

      const maxOrder = Math.max(...existing.map((i) => i.sort_order ?? 0), 0);
      await createRoutineItemsBulk({
        items: toAdd.map((s, idx) => ({
          label: s.label,
          emoji: s.emoji ?? null,
          section: s.section ?? "anytime",
          isNonNegotiable: !!s.suggestedCore,
          sortOrder: maxOrder + idx + 1,
        })),
      });

      setStatus("Starter set added.");
      setTimeout(() => setStatus(""), 1200);
    } catch (e: any) {
      setStatus(`Add failed: ${e?.message ?? String(e)}`);
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Routine library</h1>
        <p className="text-sm text-neutral-400">Add common habits fast. You can always customize later.</p>
        <div className="mt-3 flex items-center justify-between">
          <Link className="text-xs text-neutral-300 underline" href="/app/settings/routines">
            Back to routines
          </Link>
          <button
            type="button"
            onClick={() => void addStarterSet()}
            className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black"
          >
            Add starter set
          </button>
        </div>
        {status ? <p className="text-xs text-neutral-400">{status}</p> : null}
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs text-neutral-500">Search</p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="water, walk, sleep..."
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white placeholder:text-neutral-500"
        />
      </section>

      <section className="space-y-2">
        {flat.map((it) => (
          <div
            key={it.label}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base">{it.emoji ?? ""}</span>
                <p className="truncate text-sm font-semibold text-neutral-100">{it.label}</p>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                {it.section ?? "anytime"}{it.suggestedCore ? " • suggested CORE" : ""}
              </p>
            </div>
            <button
              type="button"
              disabled={addingKey === it.label}
              onClick={() => void addOne(it)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-60"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-semibold text-neutral-200">Want something specific?</p>
        <p className="mt-1 text-sm text-neutral-400">
          Go back to Routines and add your own custom habit. (We can make this screen create customs too next.)
        </p>
      </section>
    </div>
  );
}
