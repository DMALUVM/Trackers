"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import {
  createRoutineItem,
  listRoutineItems,
  updateRoutineItem,
} from "@/lib/supabaseData";
import type { RoutineItemRow } from "@/lib/types";

function SortRow({
  item,
  onToggleNon,
  onUpdate,
  onArchive,
}: {
  item: RoutineItemRow;
  onToggleNon: (item: RoutineItemRow) => void;
  onUpdate: (item: RoutineItemRow, patch: Partial<RoutineItemRow>) => void;
  onArchive: (item: RoutineItemRow) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-white/10 bg-white/5 p-3"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg p-2 text-neutral-400 hover:bg-white/10"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>

        <input
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
          value={item.label.toLowerCase() === "sex" ? "❤️" : item.label}
          onChange={(e) => onUpdate(item, { label: e.target.value })}
        />

        <input
          className="w-20 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
          value={item.emoji ?? ""}
          onChange={(e) => onUpdate(item, { emoji: e.target.value })}
          placeholder="😀"
        />

        <button
          type="button"
          onClick={() => onToggleNon(item)}
          className={
            item.is_non_negotiable
              ? "rounded-full bg-emerald-500/20 px-2 py-2 text-[11px] font-semibold text-emerald-200"
              : "rounded-full bg-white/10 px-2 py-2 text-[11px] font-semibold text-neutral-300"
          }
          title="Toggle non-negotiable"
        >
          {item.is_non_negotiable ? "NON" : "OPT"}
        </button>

        <button
          type="button"
          onClick={() => onArchive(item)}
          className="rounded-lg p-2 text-neutral-400 hover:bg-white/10"
          title="Archive"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

export default function RoutinesSettingsPage() {
  const [items, setItems] = useState<RoutineItemRow[]>([]);
  const [status, setStatus] = useState<string>("");

  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("");

  const sensors = useSensors(useSensor(PointerSensor));

  const ids = useMemo(() => items.map((i) => i.id), [items]);

  const refresh = async () => {
    const data = await listRoutineItems();
    // Ensure stable sort order client-side if nulls
    const sorted = [...data].sort((a, b) => {
      const ao = a.sort_order ?? 999999;
      const bo = b.sort_order ?? 999999;
      return ao - bo;
    });
    setItems(sorted);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const persistPatch = async (id: string, patch: Partial<RoutineItemRow>) => {
    await updateRoutineItem(id, patch);
  };

  const onUpdate = (item: RoutineItemRow, patch: Partial<RoutineItemRow>) => {
    // local optimistic
    setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, ...patch } : p)));
  };

  const onBlurSave = async (item: RoutineItemRow) => {
    setStatus("Saving...");
    try {
      await persistPatch(item.id, {
        label: item.label,
        emoji: item.emoji,
        is_non_negotiable: item.is_non_negotiable,
      });
      setStatus("Saved.");
      setTimeout(() => setStatus(""), 1000);
    } catch (e: any) {
      setStatus(`Save failed: ${e?.message ?? String(e)}`);
    }
  };

  const onToggleNon = async (item: RoutineItemRow) => {
    setStatus("Saving...");
    const next = !item.is_non_negotiable;
    setItems((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, is_non_negotiable: next } : p))
    );
    try {
      await persistPatch(item.id, { is_non_negotiable: next });
      setStatus("Saved.");
      setTimeout(() => setStatus(""), 1000);
    } catch (e: any) {
      setStatus(`Save failed: ${e?.message ?? String(e)}`);
    }
  };

  const onArchive = async (item: RoutineItemRow) => {
    setStatus("Archiving...");
    try {
      await persistPatch(item.id, { is_active: false });
      await refresh();
      setStatus("Archived.");
      setTimeout(() => setStatus(""), 1000);
    } catch (e: any) {
      setStatus(`Archive failed: ${e?.message ?? String(e)}`);
    }
  };

  const onAdd = async () => {
    if (!newLabel.trim()) return;
    setStatus("Adding...");
    try {
      const maxOrder = Math.max(...items.map((i) => i.sort_order ?? 0), 0);
      await createRoutineItem({
        label: newLabel.trim(),
        emoji: newEmoji.trim() || null,
        sortOrder: maxOrder + 1,
      });
      setNewLabel("");
      setNewEmoji("");
      await refresh();
      setStatus("Added.");
      setTimeout(() => setStatus(""), 1000);
    } catch (e: any) {
      setStatus(`Add failed: ${e?.message ?? String(e)}`);
    }
  };

  const onDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);

    // Persist order (best-effort)
    try {
      await Promise.all(
        next.map((it, idx) => updateRoutineItem(it.id, { sort_order: idx }))
      );
    } catch {
      // ignore for now
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Routine settings</h1>
        <p className="text-sm text-neutral-400">
          Edit labels/emojis, toggle NON, and drag to reorder.
        </p>
        {status ? <p className="text-xs text-neutral-400">{status}</p> : null}
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex gap-2">
          <input
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white placeholder:text-neutral-500"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Add a routine (e.g. Journaling)"
          />
          <input
            className="w-24 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white placeholder:text-neutral-500"
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
            placeholder="📝"
          />
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"
          >
            <Plus size={18} />
          </button>
        </div>
        <p className="mt-2 text-xs text-neutral-500">Emoji is paste-only for now.</p>
      </section>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((i) => (
              <div key={i.id} onBlur={() => onBlurSave(i)}>
                <SortRow
                  item={i}
                  onToggleNon={onToggleNon}
                  onUpdate={onUpdate}
                  onArchive={onArchive}
                />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
