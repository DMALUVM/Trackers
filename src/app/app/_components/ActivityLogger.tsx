"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { useToday } from "@/lib/hooks";
import { useMultiActivityTotals, type ActivityTotals, type MultiTotalsEntry } from "@/lib/hooks/useActivityTotals";
import { addActivityLog, type ActivityKey, type ActivityUnit } from "@/lib/activity";
import { SkeletonCard, Toast, type ToastState } from "@/app/app/_components/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ActivityField {
  name: string;
  label: string;
  unit: ActivityUnit;
  inputMode: "numeric" | "decimal";
  placeholder: string;
  required?: boolean;
}

export interface ActivityLoggerProps {
  title: string;
  activityKey: ActivityKey;
  emoji: string;
  fields: ActivityField[];
  historyHref: string;
  subtitle?: string;
}

// ---------------------------------------------------------------------------
// Totals grid
// ---------------------------------------------------------------------------
function TotalsGrid({ label, unit, totals, loading }: {
  label: string; unit: string; totals: ActivityTotals; loading: boolean;
}) {
  if (loading) return <SkeletonCard lines={2} />;
  const fmt = (n: number) => n >= 10000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString();

  return (
    <div className="card p-4">
      <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
        {label} ({unit})
      </p>
      <div className="grid grid-cols-4 gap-2">
        {(["WTD", "MTD", "YTD", "All"] as const).map((period, i) => {
          const vals = [totals.wtd, totals.mtd, totals.ytd, totals.all];
          return (
            <div key={period} className="text-center">
              <p className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>{period}</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {fmt(vals[i])}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ActivityLogger({ title, activityKey, emoji, fields, historyHref, subtitle }: ActivityLoggerProps) {
  const { dateKey } = useToday();
  const [values, setValues] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<ToastState>("idle");

  // Build stable entries for the multi-totals hook
  const entries = useMemo<MultiTotalsEntry[]>(() => {
    const seen = new Set<string>();
    return fields
      .filter((f) => {
        const key = `${activityKey}:${f.unit}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((f) => ({ activityKey, unit: f.unit, label: f.label }));
  }, [activityKey, fields]);

  const { data: totalsData, loading: totalsLoading, reload } = useMultiActivityTotals(entries);

  const handleSave = async () => {
    const requiredField = fields.find((f) => f.required);
    if (requiredField && !values[requiredField.name]?.trim()) return;

    setToast("saving");
    try {
      for (const field of fields) {
        const raw = values[field.name]?.trim();
        if (!raw) continue;
        const num = Number(raw);
        if (Number.isNaN(num) || num <= 0) continue;
        await addActivityLog({ dateKey, activityKey, value: num, unit: field.unit });
      }
      setValues({});
      setToast("saved");
      setTimeout(() => setToast("idle"), 1500);
      reload();
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  return (
    <div className="space-y-5">
      <Toast state={toast} />

      <header>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {emoji} {title}
        </h1>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
      </header>

      {/* Input form */}
      <section className="card p-4 space-y-3">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              {field.label} ({field.unit}){field.required ? " *" : ""}
            </label>
            <input
              className="mt-1 w-full rounded-xl px-3 py-3 text-sm"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
              inputMode={field.inputMode}
              placeholder={field.placeholder}
              value={values[field.name] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
            />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button type="button" className="btn-primary text-sm" onClick={handleSave}>
            Log {title.toLowerCase()}
          </button>
          <Link href={historyHref} className="btn-secondary text-sm text-center flex items-center justify-center gap-1.5">
            <History size={14} /> History
          </Link>
        </div>
      </section>

      {/* Totals grids */}
      {entries.map((entry) => {
        const key = `${entry.activityKey}:${entry.unit}`;
        const totals = totalsData[key] ?? { wtd: 0, mtd: 0, ytd: 0, all: 0 };
        return (
          <TotalsGrid key={key} label={title} unit={entry.unit} totals={totals} loading={totalsLoading} />
        );
      })}
    </div>
  );
}
