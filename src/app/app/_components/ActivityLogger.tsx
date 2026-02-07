"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { History, Check } from "lucide-react";
import { useToday } from "@/lib/hooks";
import { useMultiActivityTotals, type ActivityTotals, type MultiTotalsEntry } from "@/lib/hooks/useActivityTotals";
import { addActivityLog, type ActivityKey, type ActivityUnit } from "@/lib/activity";
import { SkeletonCard, Toast, type ToastState } from "@/app/app/_components/ui";
import { hapticSuccess } from "@/lib/haptics";

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

function TotalsGrid({ label, unit, totals, loading }: {
  label: string; unit: string; totals: ActivityTotals; loading: boolean;
}) {
  if (loading) return <SkeletonCard lines={2} />;
  const fmt = (n: number) => n >= 10000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString();

  return (
    <div className="card p-4">
      <p className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: "var(--text-muted)" }}>
        {label} <span style={{ color: "var(--text-faint)" }}>({unit})</span>
      </p>
      <div className="grid grid-cols-4 gap-2">
        {(["WTD", "MTD", "YTD", "All"] as const).map((period, i) => {
          const vals = [totals.wtd, totals.mtd, totals.ytd, totals.all];
          return (
            <div key={period} className="text-center">
              <p className="text-[10px] font-bold tracking-wider" style={{ color: "var(--text-faint)" }}>{period}</p>
              <p className="mt-0.5 text-base font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {fmt(vals[i])}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ActivityLogger({ title, activityKey, emoji, fields, historyHref, subtitle }: ActivityLoggerProps) {
  const { dateKey } = useToday();
  const [values, setValues] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<ToastState>("idle");
  const [justSaved, setJustSaved] = useState(false);

  const entries = useMemo<MultiTotalsEntry[]>(() => {
    const seen = new Set<string>();
    return fields
      .filter((f) => { const key = `${activityKey}:${f.unit}`; if (seen.has(key)) return false; seen.add(key); return true; })
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
      hapticSuccess();
      setValues({});
      setJustSaved(true);
      setToast("saved");
      setTimeout(() => { setToast("idle"); setJustSaved(false); }, 2000);
      reload();
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <Toast state={toast} />

      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {emoji} {title}
        </h1>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
      </header>

      {/* Input form */}
      <section className="card p-5 space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>
              {field.label}{field.required ? "" : " (optional)"}
            </label>
            <input
              className="mt-1.5 w-full rounded-xl px-4 py-3.5 text-base font-semibold tabular-nums"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
                fontSize: "1.125rem",
              }}
              inputMode={field.inputMode}
              placeholder={field.placeholder}
              value={values[field.name] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button type="button" className="btn-primary text-sm flex items-center justify-center gap-2" onClick={handleSave}>
            {justSaved ? <><Check size={16} /> Logged!</> : `Log ${title.toLowerCase()}`}
          </button>
          <Link href={historyHref} className="btn-secondary text-sm text-center flex items-center justify-center gap-2">
            <History size={16} /> History
          </Link>
        </div>
      </section>

      {/* Totals */}
      {entries.map((entry) => {
        const key = `${entry.activityKey}:${entry.unit}`;
        return <TotalsGrid key={key} label={title} unit={entry.unit} totals={totalsData[key] ?? { wtd: 0, mtd: 0, ytd: 0, all: 0 }} loading={totalsLoading} />;
      })}
    </div>
  );
}
