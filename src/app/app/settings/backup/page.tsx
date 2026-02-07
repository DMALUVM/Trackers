"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getUserId } from "@/lib/supabaseData";
import { toCsv } from "@/lib/csv";
import { Toast, type ToastState } from "@/app/app/_components/ui";

function download(filename: string, text: string, mimeType: string) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function BackupPage() {
  const [toast, setToast] = useState<ToastState>("idle");

  const fetchAll = async () => {
    const userId = await getUserId();
    const [ri, rc, dl, al, us] = await Promise.all([
      supabase.from("routine_items").select("*").eq("user_id", userId).order("sort_order", { ascending: true }),
      supabase.from("routine_checks").select("*").eq("user_id", userId).order("date", { ascending: false }),
      supabase.from("daily_logs").select("*").eq("user_id", userId).order("date", { ascending: false }),
      supabase.from("activity_logs").select("*").eq("user_id", userId).order("date", { ascending: false }),
      supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    return {
      routine_items: ri.data ?? [],
      routine_checks: rc.data ?? [],
      daily_logs: dl.data ?? [],
      activity_logs: al.data ?? [],
      user_settings: us.data ?? null,
    };
  };

  const exportJson = async () => {
    setToast("saving");
    try {
      const data = await fetchAll();
      download("routines365-backup.json", JSON.stringify(data, null, 2), "application/json");
      setToast("saved");
      setTimeout(() => setToast("idle"), 1500);
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  const exportCsv = async () => {
    setToast("saving");
    try {
      const data = await fetchAll();
      download("routine_items.csv", toCsv(data.routine_items), "text/csv");
      download("routine_checks.csv", toCsv(data.routine_checks), "text/csv");
      download("daily_logs.csv", toCsv(data.daily_logs), "text/csv");
      download("activity_logs.csv", toCsv(data.activity_logs), "text/csv");
      setToast("saved");
      setTimeout(() => setToast("idle"), 1500);
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  return (
    <div className="space-y-5">
      <Toast state={toast} />
      <header>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Backup</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          Export your data. Restore/import is coming next.
        </p>
      </header>

      <section className="card p-4 space-y-3">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Full backup (JSON)</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Downloads everything — routines, checks, logs, settings — as one JSON file.
          </p>
        </div>
        <button type="button" className="btn-primary w-full text-sm" onClick={exportJson}>
          Export JSON
        </button>
      </section>

      <section className="card p-4 space-y-3">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Spreadsheet export (CSV)</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Downloads 4 separate CSV files you can open in Excel or Google Sheets.
          </p>
        </div>
        <button type="button" className="btn-secondary w-full text-sm" onClick={exportCsv}>
          Export CSVs
        </button>
      </section>
    </div>
  );
}
