"use client";

import { useEffect, useMemo, useState } from "react";
import { toDateKey } from "@/lib/supabaseData";
import { addActivityLog, deleteActivityLogsForDate, listActivityLogs } from "@/lib/activity";

export default function NeuroPage() {
  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const [done, setDone] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      try {
        const rows = await listActivityLogs({
          from: todayKey,
          to: todayKey,
          activityKey: "neuro",
        });
        const row = rows[0];
        if (row) {
          setDone(true);
          setNotes(row.notes ?? "");
        }
      } catch {
        // ignore
      }
    };
    void run();
  }, [todayKey]);

  const save = async () => {
    setStatus("Saving...");
    try {
      // Make today idempotent: delete any existing neuro log for today and re-add if done.
      await deleteActivityLogsForDate({ dateKey: todayKey, activityKey: "neuro" });

      if (done) {
        await addActivityLog({
          dateKey: todayKey,
          activityKey: "neuro",
          value: 1,
          unit: "sessions",
          notes: notes.trim() ? notes.trim() : null,
        });
      }

      setStatus("Saved.");
      setTimeout(() => setStatus(""), 1200);
    } catch (e: any) {
      setStatus(`Save failed: ${e?.message ?? String(e)}`);
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Neurofeedback</h1>
        <p className="text-sm text-neutral-400">Session done + quick notes on how you felt.</p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-medium">Today</h2>

        <div className="mt-4 grid gap-3">
          <label className="text-xs font-medium text-neutral-300">Session</label>
          <select
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white"
            value={done ? "done" : "not"}
            onChange={(e) => setDone(e.target.value === "done")}
          >
            <option value="not">Not done</option>
            <option value="done">Done</option>
          </select>

          <label className="text-xs font-medium text-neutral-300">Notes (optional)</label>
          <textarea
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white placeholder:text-neutral-500"
            rows={6}
            placeholder="Sleep, mood, focus, anything notable..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button
            className="mt-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"
            type="button"
            onClick={save}
          >
            Save
          </button>

          {status ? <p className="text-xs text-neutral-400">{status}</p> : null}
        </div>
      </section>
    </div>
  );
}
