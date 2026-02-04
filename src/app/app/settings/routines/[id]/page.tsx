"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { RoutineItemRow } from "@/lib/types";
import { getRoutineItem, updateRoutineItem } from "@/lib/supabaseData";

type FrequencyPreset = "everyday" | "mon-fri" | "mwf" | "tth" | "custom";

const DOWS: Array<{ label: string; value: number }> = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];

function presetToDays(p: FrequencyPreset): number[] | null {
  if (p === "everyday") return null; // null means "every day" in our app
  if (p === "mon-fri") return [1, 2, 3, 4, 5];
  if (p === "mwf") return [1, 3, 5];
  if (p === "tth") return [2, 4];
  return [];
}

function inferPreset(days: number[] | null): FrequencyPreset {
  if (!days || days.length === 0) return "everyday";
  const s = new Set(days);
  const eq = (arr: number[]) => arr.length === days.length && arr.every((d) => s.has(d));
  if (eq([1, 2, 3, 4, 5])) return "mon-fri";
  if (eq([1, 3, 5])) return "mwf";
  if (eq([2, 4])) return "tth";
  return "custom";
}

export default function RoutineDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [item, setItem] = useState<RoutineItemRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");

  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("");
  const [isCore, setIsCore] = useState(false);
  const [preset, setPreset] = useState<FrequencyPreset>("everyday");
  const [customDays, setCustomDays] = useState<number[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const it = await getRoutineItem(id);
        if (!it) {
          router.replace("/app/settings/routines");
          return;
        }
        setItem(it);
        setLabel(it.label.toLowerCase() === "sex" ? "❤️" : it.label);
        setEmoji(it.emoji ?? "");
        setIsCore(!!it.is_non_negotiable);
        const p = inferPreset(it.days_of_week);
        setPreset(p);
        setCustomDays((it.days_of_week ?? []).slice());
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [id, router]);

  const effectiveDays = useMemo(() => {
    if (preset === "custom") return customDays.slice().sort((a, b) => a - b);
    return presetToDays(preset);
  }, [preset, customDays]);

  const save = async (patch: Partial<RoutineItemRow>) => {
    if (!id) return;
    setStatus("Saving…");
    try {
      await updateRoutineItem(id, patch);
      setStatus("Saved.");
      setTimeout(() => setStatus(""), 800);
    } catch (e: any) {
      setStatus(`Save failed: ${e?.message ?? String(e)}`);
    }
  };

  const toggleDay = (d: number) => {
    setCustomDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const onSaveAll = async () => {
    // Default behavior: if user marks a habit CORE and doesn't explicitly schedule it,
    // it should effectively be "every day".
    const daysPatch = preset === "everyday" ? null : preset === "custom" ? effectiveDays : effectiveDays;

    await save({
      label,
      emoji: emoji.trim() || null,
      is_non_negotiable: isCore,
      days_of_week: daysPatch && Array.isArray(daysPatch) && daysPatch.length === 0 ? null : daysPatch,
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">Routine</h1>
        <p className="text-sm text-neutral-400">Loading…</p>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Routine details</h1>
          <p className="text-sm text-neutral-400">Rename, set CORE, and set frequency.</p>
        </div>
        <Link
          href="/app/settings/routines"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
        >
          Back
        </Link>
      </header>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <p className="text-xs text-neutral-500">Name</p>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Routine name"
            />
          </div>
          <div>
            <p className="text-xs text-neutral-500">Emoji</p>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="😀"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500">CORE</p>
            <p className="text-sm text-neutral-300">CORE drives your Daily Score.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsCore((v) => !v)}
            className={
              isCore
                ? "rounded-full bg-emerald-500/20 px-3 py-2 text-[12px] font-semibold text-emerald-200"
                : "rounded-full bg-white/10 px-3 py-2 text-[12px] font-semibold text-neutral-300"
            }
          >
            {isCore ? "CORE" : "Optional"}
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div>
          <p className="text-xs text-neutral-500">Frequency</p>
          <p className="text-sm text-neutral-300">When should this show up in Today?</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {([
            { key: "everyday", label: "Every day" },
            { key: "mon-fri", label: "Mon–Fri" },
            { key: "mwf", label: "Mon/Wed/Fri" },
            { key: "tth", label: "Tue/Thu" },
            { key: "custom", label: "Custom" },
          ] as const).map((opt) => {
            const active = preset === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setPreset(opt.key)}
                className={
                  "rounded-xl px-3 py-3 text-sm font-semibold " +
                  (active
                    ? "bg-white text-black"
                    : "border border-white/10 bg-white/5 text-white hover:bg-white/10")
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {preset === "custom" ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {DOWS.map((d) => {
              const active = customDays.includes(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className={
                    "rounded-full px-3 py-2 text-xs font-semibold " +
                    (active ? "bg-sky-400 text-black" : "bg-white/10 text-white")
                  }
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      <div className="flex items-center justify-between">
        {status ? <p className="text-xs text-neutral-400">{status}</p> : <span />}
        <button
          type="button"
          onClick={() => void onSaveAll()}
          className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"
        >
          Save
        </button>
      </div>
    </div>
  );
}
