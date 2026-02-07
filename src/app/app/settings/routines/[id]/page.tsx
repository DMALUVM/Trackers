"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { RoutineItemRow } from "@/lib/types";
import { getRoutineItem, updateRoutineItem } from "@/lib/supabaseData";
import { Toast, SkeletonCard, SubPageHeader, type ToastState } from "@/app/app/_components/ui";

type FrequencyPreset = "everyday" | "mon-fri" | "mwf" | "tth" | "custom";

const DOWS = [
  { label: "Mon", value: 1 }, { label: "Tue", value: 2 }, { label: "Wed", value: 3 },
  { label: "Thu", value: 4 }, { label: "Fri", value: 5 }, { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];

function presetToDays(p: FrequencyPreset): number[] | null {
  if (p === "everyday") return null;
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
  const [toast, setToast] = useState<ToastState>("idle");

  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("");
  const [isCore, setIsCore] = useState(false);
  const [preset, setPreset] = useState<FrequencyPreset>("everyday");
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!id) return;
      setLoading(true);
      try {
        const it = await getRoutineItem(id);
        if (!it) { router.replace("/app/settings/routines"); return; }
        setItem(it);
        setLabel(it.label);
        setEmoji(it.emoji ?? "");
        setIsCore(!!it.is_non_negotiable);
        setPreset(inferPreset(it.days_of_week));
        setCustomDays((it.days_of_week ?? []).slice());
      } finally { setLoading(false); }
    })();
  }, [id, router]);

  const effectiveDays = useMemo(() => {
    if (preset === "custom") return customDays.slice().sort((a, b) => a - b);
    return presetToDays(preset);
  }, [preset, customDays]);

  const showToast = (state: ToastState) => {
    setToast(state);
    if (state === "saved") setTimeout(() => setToast("idle"), 1500);
  };

  const saveField = async (patch: Partial<RoutineItemRow>) => {
    if (!id) return;
    setSaving(true); showToast("saving");
    try {
      await updateRoutineItem(id, patch);
      showToast("saved");
    } catch { showToast("error"); }
    finally { setSaving(false); }
  };

  const quickSaveCore = async () => {
    const next = !isCore;
    setIsCore(next);
    const daysPatch = next && Array.isArray(item?.days_of_week) && item!.days_of_week!.length === 0 ? null : undefined;
    await saveField({ is_non_negotiable: next, ...(daysPatch !== undefined ? { days_of_week: daysPatch } : {}) });
  };

  const quickSavePreset = async (nextPreset: FrequencyPreset) => {
    setPreset(nextPreset);
    if (nextPreset === "custom") return;
    const days = presetToDays(nextPreset);
    await saveField({ days_of_week: days && days.length === 0 ? null : days });
  };

  const onSaveAll = async () => {
    const daysPatch = preset === "everyday" ? null : effectiveDays;
    await saveField({
      label, emoji: emoji.trim() || null, is_non_negotiable: isCore,
      days_of_week: daysPatch && Array.isArray(daysPatch) && daysPatch.length === 0 ? null : daysPatch,
    });
  };

  if (loading) return <SkeletonCard lines={4} />;
  if (!item) return null;

  return (
    <div className="space-y-5">
      <Toast state={toast} />

      <SubPageHeader title="Routine details" subtitle="Rename, set CORE, and set frequency" backHref="/app/settings/routines" />

      {/* Name + Emoji + Core */}
      <section className="card p-4 space-y-3">
        <div>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>Name</p>
          <input className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
            value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Routine name" />
        </div>
        <div>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>Emoji</p>
          <input className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
            value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="😀" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>CORE</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>CORE drives your Daily Score.</p>
          </div>
          <button type="button" onClick={() => void quickSaveCore()} disabled={saving}
            className="rounded-full px-3 py-2 text-[12px] font-semibold"
            style={{
              background: isCore ? "var(--accent-green-soft)" : "var(--bg-card-hover)",
              color: isCore ? "var(--accent-green-text)" : "var(--text-muted)",
              opacity: saving ? 0.6 : 1,
            }}>
            {isCore ? "CORE" : "Optional"}
          </button>
        </div>
      </section>

      {/* Frequency */}
      <section className="card p-4 space-y-3">
        <div>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>Frequency</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>When should this show up in Today?</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {([
            { key: "everyday" as const, label: "Every day" },
            { key: "mon-fri" as const, label: "Mon–Fri" },
            { key: "mwf" as const, label: "Mon/Wed/Fri" },
            { key: "tth" as const, label: "Tue/Thu" },
            { key: "custom" as const, label: "Custom" },
          ]).map((opt) => (
            <button key={opt.key} type="button" onClick={() => void quickSavePreset(opt.key)}
              className={preset === opt.key ? "btn-primary text-sm" : "btn-secondary text-sm"}>
              {opt.label}
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <div className="mt-2 flex flex-wrap gap-2">
            {DOWS.map((d) => {
              const active = customDays.includes(d.value);
              return (
                <button key={d.value} type="button"
                  onClick={() => setCustomDays((prev) => prev.includes(d.value) ? prev.filter((x) => x !== d.value) : [...prev, d.value])}
                  className="rounded-full px-3 py-2 text-xs font-semibold"
                  style={{
                    background: active ? "var(--accent-green)" : "var(--bg-card-hover)",
                    color: active ? "var(--text-inverse)" : "var(--text-primary)",
                  }}>
                  {d.label}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <button type="button" onClick={() => void onSaveAll()} className="btn-primary text-sm">Save</button>
      </div>
    </div>
  );
}
