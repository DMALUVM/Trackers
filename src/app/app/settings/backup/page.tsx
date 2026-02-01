"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getUserId } from "@/lib/supabaseData";

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BackupPage() {
  const [status, setStatus] = useState<string>("");

  const exportJson = async () => {
    setStatus("Exporting...");
    try {
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
          supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
        ]);

      const errors = [
        routineItems.error,
        routineChecks.error,
        dailyLogs.error,
        activityLogs.error,
        userSettings.error,
      ].filter(Boolean);
      if (errors.length) throw errors[0];

      const payload = {
        exported_at: new Date().toISOString(),
        user_id: userId,
        data: {
          routine_items: routineItems.data ?? [],
          routine_checks: routineChecks.data ?? [],
          daily_logs: dailyLogs.data ?? [],
          activity_logs: activityLogs.data ?? [],
          user_settings: userSettings.data ?? null,
        },
      };

      const filename = `daily-routines-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      download(filename, JSON.stringify(payload, null, 2));
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
          Download a JSON backup of your routines, checks, logs, and activity history.
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
        <p className="text-xs text-neutral-500">
          Restore/import is coming next (we’ll do it carefully to avoid duplicates).
        </p>
      </section>
    </div>
  );
}
