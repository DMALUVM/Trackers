"use client";

import { useEffect, useState } from "react";
import { listRoutineItems, updateRoutineItem } from "@/lib/supabaseData";
import type { RoutineItemRow } from "@/lib/types";

export default function RoutinesSettingsPage() {
  const [items, setItems] = useState<RoutineItemRow[]>([]);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      const data = await listRoutineItems();
      setItems(data);
    };
    void run();
  }, []);

  const toggleNonneg = async (item: RoutineItemRow) => {
    setStatus("Saving...");
    try {
      await updateRoutineItem(item.id, {
        is_non_negotiable: !item.is_non_negotiable,
      });
      setItems((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? { ...p, is_non_negotiable: !p.is_non_negotiable }
            : p
        )
      );
      setStatus("Saved.");
      setTimeout(() => setStatus(""), 1200);
    } catch (e: any) {
      setStatus(`Save failed: ${e?.message ?? String(e)}`);
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Routine settings</h1>
        <p className="text-sm text-neutral-400">
          Toggle non-negotiables. (Label/emoji editing coming next.)
        </p>
        {status ? <p className="text-xs text-neutral-400">{status}</p> : null}
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="space-y-2">
          {items.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => toggleNonneg(i)}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{i.emoji ?? ""}</span>
                <span className="text-neutral-100">
                  {i.label.toLowerCase() === "sex" ? "❤️" : i.label}
                </span>
              </div>
              <span
                className={
                  i.is_non_negotiable
                    ? "rounded-full bg-emerald-500/20 px-2 py-1 text-[11px] font-semibold text-emerald-200"
                    : "rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-neutral-300"
                }
              >
                {i.is_non_negotiable ? "NON" : "OPTIONAL"}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
