"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getUserId } from "@/lib/supabaseData";
import { toCsv } from "@/lib/csv";

function download(filename: string, text: string, mimeType: string) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BackupPage() {
  const [status, setStatus] = useState<string>("");

  const fetchAll = async () => {
    const userId = await getUserId();

    const [routineItems, routineChecks, dailyLogs, activityLogs, userSettings] =
      await Promise.all([
        supabase
          .from("routine_items")
          .select("*")
          .eq("user_id", userId)
          .order("sort_order", { ascending: true }),
        supabase
          .from("routine_checks")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false }),
        supabase
          .from("daily_logs")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false }),
        supabase
          .from("activity_logs")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false }),
        supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

    const errors = [
      routineItems.error,
      routineChecks.error,
      dailyLogs.error,
      activityLogs.error,
      userSettings.error,
    ].filter(Boolean);
    if (errors.length) throw errors[0];

    return {
      userId,
      routineItems: routineItems.data ?? [],
      routineChecks: routineChecks.data ?? [],
      dailyLogs: dailyLogs.data ?? [],
      activityLogs: activityLogs.data ?? [],
      userSettings: userSettings.data ?? null,
    };
  };

  const exportJson = async () => {
    setStatus("Exporting...");
    try {
      const { userId, routineItems, routineChecks, dailyLogs, activityLogs, userSettings } =
        await fetchAll();

      const payload = {
        exported_at: new Date().toISOString(),
        user_id: userId,
        data: {
          routine_items: routineItems,
          routine_checks: routineChecks,
          daily_logs: dailyLogs,
          activity_logs: activityLogs,
          user_settings: userSettings,
        },
      };

      const filename = `daily-routines-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      download(filename, JSON.stringify(payload, null, 2), "application/json");
      setStatus("Downloaded.");
      setTimeout(() => setStatus(""), 1000);
    } catch (e: any) {
      setStatus(`Export failed: ${e?.message ?? String(e)}`);
    }
  };

  const exportCsv = async () => {
    setStatus("Exporting...");
    try {
      const { routineItems, routineChecks, dailyLogs, activityLogs } = await fetchAll();
      const date = new Date().toISOString().slice(0, 10);

      download(`routines365-routine-items-${date}.csv`, toCsv(routineItems), "text/csv");
      download(`routines365-routine-checks-${date}.csv`, toCsv(routineChecks), "text/csv");
      download(`routines365-daily-logs-${date}.csv`, toCsv(dailyLogs), "text/csv");
      download(`routines365-activity-logs-${date}.csv`, toCsv(activityLogs), "text/csv");

      setStatus("Downloaded.");
      setTimeout(() => setStatus(""), 1000);
    } catch (e: any) {
      setStatus(`Export failed: ${e?.message ?? String(e)}`);
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Export / Backup</h1>
        <p className="text-sm text-neutral-400">
          Download your data as JSON (full backup) or CSV (easy to view in Sheets).
        </p>
        {status ? <p className="text-xs text-neutral-400">{status}</p> : null}
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <button
          className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"
          onClick={exportJson}
          type="button"
        >
          Download JSON backup
        </button>

        <button
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
          onClick={exportCsv}
          type="button"
        >
          Download CSV files
        </button>

        <p className="text-xs text-neutral-500">
          Restore/import is coming next (we’ll do it carefully to avoid duplicates).
        </p>
      </section>
    </div>
  );
}
