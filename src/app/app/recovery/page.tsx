"use client";

import { useEffect, useMemo, useState } from "react";
import { Flame, Snowflake } from "lucide-react";
import { format, startOfMonth, startOfWeek, startOfYear } from "date-fns";
import { toDateKey } from "@/lib/supabaseData";
import { addActivityLog, sumActivity } from "@/lib/activity";

export default function RecoveryPage() {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [status, setStatus] = useState<string>("");
  const [totals, setTotals] = useState<{ saunaWtd: number; saunaMtd: number; saunaYtd: number; saunaAll: number; coldWtd: number; coldMtd: number; coldYtd: number; coldAll: number } | null>(null);

  async function refreshTotals() {
    const now = new Date();
    const fromW = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const fromM = format(startOfMonth(now), "yyyy-MM-dd");
    const fromY = format(startOfYear(now), "yyyy-MM-dd");
    const to = format(now, "yyyy-MM-dd");

    const [saunaWtd, saunaMtd, saunaYtd, saunaAll, coldWtd, coldMtd, coldYtd, coldAll] = await Promise.all([
      sumActivity({ from: fromW, to, activityKey: "sauna", unit: "sessions" }),
      sumActivity({ from: fromM, to, activityKey: "sauna", unit: "sessions" }),
      sumActivity({ from: fromY, to, activityKey: "sauna", unit: "sessions" }),
      sumActivity({ from: "2000-01-01", to, activityKey: "sauna", unit: "sessions" }),
      sumActivity({ from: fromW, to, activityKey: "cold", unit: "sessions" }),
      sumActivity({ from: fromM, to, activityKey: "cold", unit: "sessions" }),
      sumActivity({ from: fromY, to, activityKey: "cold", unit: "sessions" }),
      sumActivity({ from: "2000-01-01", to, activityKey: "cold", unit: "sessions" }),
    ]);

    setTotals({ saunaWtd, saunaMtd, saunaYtd, saunaAll, coldWtd, coldMtd, coldYtd, coldAll });
  }

  useEffect(() => {
    void refreshTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = async (key: "sauna" | "cold") => {
    setStatus("Saving...");
    try {
      await addActivityLog({ dateKey: todayKey, activityKey: key, value: 1, unit: "sessions" });
      setStatus("Saved.");
      void refreshTotals();
      setTimeout(() => setStatus(""), 1000);
    } catch (e: any) {
      setStatus(`Save failed: ${e?.message ?? String(e)}`);
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Recovery</h1>
        <p className="text-sm text-neutral-400">Log sessions. Track totals.</p>
        {status ? <p className="text-xs text-neutral-400">{status}</p> : null}
      </header>

      <section className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void add("sauna")}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
        >
          <p className="text-sm font-semibold text-white">Sauna</p>
          <p className="mt-1 text-xs text-neutral-400">+1 session</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-neutral-200">
            <Flame size={14} /> Log
          </div>
        </button>

        <button
          type="button"
          onClick={() => void add("cold")}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
        >
          <p className="text-sm font-semibold text-white">Cold plunge</p>
          <p className="mt-1 text-xs text-neutral-400">+1 session</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-neutral-200">
            <Snowflake size={14} /> Log
          </div>
        </button>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div>
          <h2 className="text-base font-medium">Totals</h2>
          <p className="mt-1 text-sm text-neutral-400">WTD / MTD / YTD / All time</p>
        </div>

        {totals ? (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-500">Sauna WTD</p>
              <p className="mt-1 font-semibold text-white">{Math.round(totals.saunaWtd)} sessions</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-500">Cold WTD</p>
              <p className="mt-1 font-semibold text-white">{Math.round(totals.coldWtd)} sessions</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-500">Sauna MTD</p>
              <p className="mt-1 font-semibold text-white">{Math.round(totals.saunaMtd)} sessions</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-500">Cold MTD</p>
              <p className="mt-1 font-semibold text-white">{Math.round(totals.coldMtd)} sessions</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-500">Sauna YTD</p>
              <p className="mt-1 font-semibold text-white">{Math.round(totals.saunaYtd)} sessions</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-500">Cold YTD</p>
              <p className="mt-1 font-semibold text-white">{Math.round(totals.coldYtd)} sessions</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-500">Sauna All time</p>
              <p className="mt-1 font-semibold text-white">{Math.round(totals.saunaAll)} sessions</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-neutral-500">Cold All time</p>
              <p className="mt-1 font-semibold text-white">{Math.round(totals.coldAll)} sessions</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-400">Loading totals…</p>
        )}
      </section>
    </div>
  );
}
