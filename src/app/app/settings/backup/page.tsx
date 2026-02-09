"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getUserId } from "@/lib/supabaseData";
import { toCsv } from "@/lib/csv";
import { Toast, SubPageHeader, Spinner, type ToastState } from "@/app/app/_components/ui";

function download(filename: string, text: string, mimeType: string) {
  const blob = new Blob([text], { type: mimeType });
  const file = new File([blob], filename, { type: mimeType });

  // In Capacitor/iOS, createElement('a').download doesn't work
  // Use Web Share API with file if available
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    void navigator.share({ files: [file] }).catch(() => {});
    return;
  }

  // Fallback for desktop web
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function BackupPage() {
  const [toast, setToast] = useState<ToastState>("idle");
  const [busy, setBusy] = useState<string | null>(null);

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
    setBusy("json"); setToast("saving");
    try {
      const data = await fetchAll();
      download("routines365-backup.json", JSON.stringify(data, null, 2), "application/json");
      setToast("saved"); setTimeout(() => setToast("idle"), 1500);
    } catch { setToast("error"); setTimeout(() => setToast("idle"), 3000); }
    finally { setBusy(null); }
  };

  const exportCsv = async () => {
    setBusy("csv"); setToast("saving");
    try {
      const data = await fetchAll();
      const files = [
        { name: "routine_items.csv", content: toCsv(data.routine_items) },
        { name: "routine_checks.csv", content: toCsv(data.routine_checks) },
        { name: "daily_logs.csv", content: toCsv(data.daily_logs) },
        { name: "activity_logs.csv", content: toCsv(data.activity_logs) },
      ];

      // On iOS, share all files at once
      const fileObjs = files.map(f => new File([f.content], f.name, { type: "text/csv" }));
      if (navigator.share && navigator.canShare?.({ files: fileObjs })) {
        await navigator.share({ files: fileObjs }).catch(() => {});
      } else {
        // Desktop fallback: download one by one
        for (const f of files) download(f.name, f.content, "text/csv");
      }
      setToast("saved"); setTimeout(() => setToast("idle"), 1500);
    } catch { setToast("error"); setTimeout(() => setToast("idle"), 3000); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-5">
      <Toast state={toast} />
      <SubPageHeader title="Backup" subtitle="Export your data" backHref="/app/settings" />

      <section className="card p-4 space-y-3">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Full backup (JSON)</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Everything — routines, checks, logs, settings — as one JSON file.
          </p>
        </div>
        <button type="button" className="btn-primary w-full text-sm flex items-center justify-center gap-2" onClick={exportJson} disabled={!!busy}>
          {busy === "json" ? <><Spinner size={14} /> Exporting…</> : "Export JSON"}
        </button>
      </section>

      <section className="card p-4 space-y-3">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Spreadsheet export (CSV)</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            4 separate CSV files for Excel or Google Sheets.
          </p>
        </div>
        <button type="button" className="btn-secondary w-full text-sm flex items-center justify-center gap-2" onClick={exportCsv} disabled={!!busy}>
          {busy === "csv" ? <><Spinner size={14} /> Exporting…</> : "Export CSVs"}
        </button>
      </section>
    </div>
  );
}
