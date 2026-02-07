"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/app/app/_components/ui/BottomSheet";

export type MetricKind =
  | { key: "rowing"; title: string; emoji: string }
  | { key: "running"; title: string; emoji: string }
  | { key: "walking"; title: string; emoji: string }
  | { key: "sauna"; title: string; emoji: string }
  | { key: "cold"; title: string; emoji: string };

export function MetricSheet(opts: {
  open: boolean;
  kind: MetricKind | null;
  onClose: () => void;
  onSave: (payload: {
    meters?: number;
    minutes?: number;
    miles?: number;
    steps?: number;
    sessions?: number;
  }) => Promise<void>;
}) {
  const { open, kind, onClose, onSave } = opts;

  const [meters, setMeters] = useState("");
  const [minutes, setMinutes] = useState("");
  const [miles, setMiles] = useState("");
  const [steps, setSteps] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMeters("");
    setMinutes("");
    setMiles("");
    setSteps("");
    setStatus("");
    setSaving(false);
  }, [open, kind?.key]);

  const save = async () => {
    if (!kind || saving) return;
    setSaving(true);
    setStatus("");

    try {
      if (kind.key === "rowing") {
        const m = meters.trim() ? Number(meters) : NaN;
        if (!Number.isFinite(m) || m <= 0) { setStatus("Enter meters."); setSaving(false); return; }
        const min = minutes.trim() ? Number(minutes) : NaN;
        await onSave({ meters: m, minutes: Number.isFinite(min) && min > 0 ? min : undefined });
        onClose();
        return;
      }
      if (kind.key === "running") {
        const v = miles.trim() ? Number(miles) : NaN;
        if (!Number.isFinite(v) || v <= 0) { setStatus("Enter miles."); setSaving(false); return; }
        await onSave({ miles: v });
        onClose();
        return;
      }
      if (kind.key === "walking") {
        const v = steps.trim() ? Number(steps) : NaN;
        if (!Number.isFinite(v) || v <= 0) { setStatus("Enter steps."); setSaving(false); return; }
        await onSave({ steps: Math.round(v) });
        onClose();
        return;
      }
      if (kind.key === "sauna" || kind.key === "cold") {
        await onSave({ sessions: 1 });
        onClose();
        return;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus(`Save failed: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const title = kind ? `${kind.emoji} ${kind.title}` : "";

  return (
    <BottomSheet open={open && !!kind} onClose={onClose} title={title}>
      <div className="space-y-4">
        {kind?.key === "rowing" && (
          <>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Meters</label>
              <input
                className="mt-1.5 w-full rounded-xl px-3 py-3 text-base"
                style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-primary)" }}
                inputMode="numeric"
                type="number"
                placeholder="5000"
                value={meters}
                onChange={(e) => setMeters(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Minutes (optional)</label>
              <input
                className="mt-1.5 w-full rounded-xl px-3 py-3 text-base"
                style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-primary)" }}
                inputMode="decimal"
                type="number"
                step={0.1}
                placeholder="20"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </div>
          </>
        )}

        {kind?.key === "running" && (
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Miles</label>
            <input
              className="mt-1.5 w-full rounded-xl px-3 py-3 text-base"
              style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-primary)" }}
              inputMode="decimal"
              type="number"
              step={0.1}
              placeholder="2.5"
              value={miles}
              onChange={(e) => setMiles(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {kind?.key === "walking" && (
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Steps</label>
            <input
              className="mt-1.5 w-full rounded-xl px-3 py-3 text-base"
              style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-primary)" }}
              inputMode="numeric"
              type="number"
              placeholder="8500"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {(kind?.key === "sauna" || kind?.key === "cold") && (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            This will log <strong>+1 session</strong> for today.
          </p>
        )}

        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="btn-primary w-full"
        >
          {saving ? "Saving…" : "Save"}
        </button>

        {status && (
          <p className="text-xs text-center" style={{ color: "var(--accent-red-text)" }}>
            {status}
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
