"use client";

import { useEffect, useMemo, useState } from "react";

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
  onSave: (payload: { meters?: number; minutes?: number; miles?: number; steps?: number; sessions?: number }) => Promise<void>;
}) {
  const { open, kind, onClose, onSave } = opts;

  const [meters, setMeters] = useState<string>("");
  const [minutes, setMinutes] = useState<string>("");
  const [miles, setMiles] = useState<string>("");
  const [steps, setSteps] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setMeters("");
    setMinutes("");
    setMiles("");
    setSteps("");
    setStatus("");
  }, [open, kind?.key]);

  const save = async () => {
    if (!kind) return;
    setStatus("Saving...");
    try {
      if (kind.key === "rowing") {
        const m = meters.trim() ? Number(meters) : NaN;
        if (!Number.isFinite(m) || m <= 0) {
          setStatus("Enter meters.");
          return;
        }
        const min = minutes.trim() ? Number(minutes) : NaN;
        await onSave({ meters: m, minutes: Number.isFinite(min) && min > 0 ? min : undefined });
        onClose();
        return;
      }

      if (kind.key === "running") {
        const v = miles.trim() ? Number(miles) : NaN;
        if (!Number.isFinite(v) || v <= 0) {
          setStatus("Enter miles.");
          return;
        }
        await onSave({ miles: v });
        onClose();
        return;
      }

      if (kind.key === "walking") {
        const v = steps.trim() ? Number(steps) : NaN;
        if (!Number.isFinite(v) || v <= 0) {
          setStatus("Enter steps.");
          return;
        }
        await onSave({ steps: Math.round(v) });
        onClose();
        return;
      }

      if (kind.key === "sauna" || kind.key === "cold") {
        await onSave({ sessions: 1 });
        onClose();
        return;
      }
    } catch (e: any) {
      setStatus(`Save failed: ${e?.message ?? String(e)}`);
    }
  };

  const title = kind ? `${kind.emoji} ${kind.title}` : "";

  if (!open || !kind) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close"
      />

      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-3xl border border-white/10 bg-neutral-950 p-4">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-white">{title}</p>
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-white/10"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {kind.key === "rowing" ? (
            <>
              <div>
                <p className="text-xs text-neutral-400">Meters</p>
                <input
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-base text-white placeholder:text-neutral-500"
                  inputMode="numeric"
                  type="number"
                  placeholder="5000"
                  value={meters}
                  onChange={(e) => setMeters(e.target.value)}
                />
              </div>
              <div>
                <p className="text-xs text-neutral-400">Minutes (optional)</p>
                <input
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-base text-white placeholder:text-neutral-500"
                  inputMode="decimal"
                  type="number"
                  step={0.1}
                  placeholder="20"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                />
              </div>
            </>
          ) : null}

          {kind.key === "running" ? (
            <div>
              <p className="text-xs text-neutral-400">Miles</p>
              <input
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-base text-white placeholder:text-neutral-500"
                inputMode="decimal"
                type="number"
                step={0.1}
                placeholder="2.5"
                value={miles}
                onChange={(e) => setMiles(e.target.value)}
              />
            </div>
          ) : null}

          {kind.key === "walking" ? (
            <div>
              <p className="text-xs text-neutral-400">Steps</p>
              <input
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-base text-white placeholder:text-neutral-500"
                inputMode="numeric"
                type="number"
                step={1}
                placeholder="8500"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
              />
            </div>
          ) : null}

          {kind.key === "sauna" || kind.key === "cold" ? (
            <p className="text-sm text-neutral-300">This will log <b>+1 session</b> for today.</p>
          ) : null}

          <button
            type="button"
            onClick={() => void save()}
            className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"
          >
            Save
          </button>

          {status ? <p className="text-xs text-neutral-400">{status}</p> : null}
        </div>
      </div>
    </div>
  );
}
