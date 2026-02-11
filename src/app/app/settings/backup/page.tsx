"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getUserId } from "@/lib/supabaseData";
import { toCsv } from "@/lib/csv";
import { Toast, SubPageHeader, Spinner, type ToastState } from "@/app/app/_components/ui";

function download(filename: string, text: string, mimeType: string) {
  const blob = new Blob([text], { type: mimeType });
  const file = new File([blob], filename, { type: mimeType });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    void navigator.share({ files: [file] }).catch(() => {});
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

type BackupData = {
  _meta?: { app?: string; version?: number; exported_at?: string };
  routine_items?: Record<string, unknown>[];
  daily_checks?: Record<string, unknown>[];
  routine_checks?: Record<string, unknown>[]; // legacy name
  daily_logs?: Record<string, unknown>[];
  activity_logs?: Record<string, unknown>[];
  user_settings?: Record<string, unknown> | null;
};

export default function BackupPage() {
  const [toast, setToast] = useState<ToastState>("idle");
  const [toastMsg, setToastMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [pendingFile, setPendingFile] = useState<BackupData | null>(null);
  const [pendingStats, setPendingStats] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const show = (state: ToastState, msg?: string) => {
    setToast(state); setToastMsg(msg ?? "");
    if (state === "saved" || state === "error") setTimeout(() => setToast("idle"), 3000);
  };

  const fetchAll = async () => {
    const userId = await getUserId();
    const [ri, dc, dl, al, us] = await Promise.all([
      supabase.from("routine_items").select("*").eq("user_id", userId).order("sort_order", { ascending: true }),
      supabase.from("daily_checks").select("*").eq("user_id", userId).order("date", { ascending: false }),
      supabase.from("daily_logs").select("*").eq("user_id", userId).order("date", { ascending: false }),
      supabase.from("activity_logs").select("*").eq("user_id", userId).order("date", { ascending: false }),
      supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    return {
      routine_items: ri.data ?? [],
      daily_checks: dc.data ?? [],
      daily_logs: dl.data ?? [],
      activity_logs: al.data ?? [],
      user_settings: us.data ?? null,
    };
  };

  const exportJson = async () => {
    setBusy("json"); show("saving");
    try {
      const data = await fetchAll();
      const backup = {
        _meta: {
          app: "Routines365",
          version: 1,
          exported_at: new Date().toISOString(),
        },
        ...data,
      };
      const dateStr = new Date().toISOString().slice(0, 10);
      download(`routines365-backup-${dateStr}.json`, JSON.stringify(backup, null, 2), "application/json");
      show("saved", "Backup exported");
    } catch { show("error", "Export failed"); }
    finally { setBusy(null); }
  };

  const exportCsv = async () => {
    setBusy("csv"); show("saving");
    try {
      const data = await fetchAll();
      const files = [
        { name: "routine_items.csv", content: toCsv(data.routine_items) },
        { name: "daily_checks.csv", content: toCsv(data.daily_checks) },
        { name: "daily_logs.csv", content: toCsv(data.daily_logs) },
        { name: "activity_logs.csv", content: toCsv(data.activity_logs) },
      ];

      const fileObjs = files.map(f => new File([f.content], f.name, { type: "text/csv" }));
      if (navigator.share && navigator.canShare?.({ files: fileObjs })) {
        await navigator.share({ files: fileObjs }).catch(() => {});
      } else {
        for (const f of files) download(f.name, f.content, "text/csv");
      }
      show("saved", "CSVs exported");
    } catch { show("error", "Export failed"); }
    finally { setBusy(null); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as BackupData;

        // Support both "daily_checks" and legacy "routine_checks"
        const checks = data.daily_checks ?? data.routine_checks ?? [];
        const items = data.routine_items ?? [];
        const logs = data.daily_logs ?? [];
        const activities = data.activity_logs ?? [];

        if (items.length === 0 && checks.length === 0) {
          show("error", "File has no data to restore");
          return;
        }

        const stats = [
          items.length > 0 ? `${items.length} routines` : null,
          checks.length > 0 ? `${checks.length} check records` : null,
          logs.length > 0 ? `${logs.length} daily logs` : null,
          activities.length > 0 ? `${activities.length} activity logs` : null,
        ].filter(Boolean).join(", ");

        setPendingFile({ ...data, daily_checks: checks });
        setPendingStats(stats);
        setConfirmRestore(true);
      } catch {
        show("error", "Invalid JSON file");
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const doRestore = async () => {
    if (!pendingFile) return;
    setBusy("restore"); show("saving");
    setConfirmRestore(false);

    try {
      const userId = await getUserId();

      // ── Wipe existing data so restore is a clean replacement ──
      await Promise.all([
        supabase.from("day_snoozes").delete().eq("user_id", userId),
        supabase.from("daily_checks").delete().eq("user_id", userId),
        supabase.from("daily_logs").delete().eq("user_id", userId),
        supabase.from("activity_logs").delete().eq("user_id", userId),
        supabase.from("routine_items").delete().eq("user_id", userId),
      ]);

      // Helper: stamp user_id, strip old id so Supabase generates new ones
      const stamp = (rows: Record<string, unknown>[]) =>
        rows.map((r) => {
          const row: Record<string, unknown> = { ...r, user_id: userId };
          delete row.id;
          return row;
        });

      // 1. Restore routine_items — need to map old IDs to new IDs
      const oldItems = pendingFile.routine_items ?? [];
      const idMap = new Map<string, string>(); // old_id → new_id

      if (oldItems.length > 0) {
        for (const item of oldItems) {
          const oldId = item.id as string;
          const row: Record<string, unknown> = { ...item, user_id: userId };
          delete row.id;
          const { data, error } = await supabase
            .from("routine_items")
            .insert(row)
            .select("id")
            .single();
          if (error) {
            console.warn("Skipping routine_item (may already exist):", (row.label as string), error.message);
            continue;
          }
          idMap.set(oldId, data.id);
        }
      }

      // 2. Restore daily_checks — remap routine_item_id
      const checks = pendingFile.daily_checks ?? [];
      if (checks.length > 0) {
        const mapped = checks
          .map((c) => {
            const row: Record<string, unknown> = { ...c, user_id: userId };
            delete row.id;
            const oldRiId = row.routine_item_id as string;
            if (idMap.has(oldRiId)) {
              row.routine_item_id = idMap.get(oldRiId)!;
            } else {
              // Old ID not remapped — skip this check (routine wasn't imported)
              return null;
            }
            return row;
          })
          .filter((r): r is Record<string, unknown> => r !== null);

        // Insert in batches of 500, ignore conflicts
        for (let i = 0; i < mapped.length; i += 500) {
          const batch = mapped.slice(i, i + 500);
          const { error } = await supabase.from("daily_checks").insert(batch);
          if (error) {
            console.warn(`daily_checks batch ${i}: ${error.message}`);
            // Try one-by-one for this batch to skip just the conflicting rows
            for (const row of batch) {
              await supabase.from("daily_checks").insert(row).then(({ error: e }) => {
                if (e) console.warn("Skipping check:", e.message);
              });
            }
          }
        }
      }

      // 3. Restore daily_logs — use upsert on (user_id, date) to avoid conflicts
      const logs = pendingFile.daily_logs ?? [];
      if (logs.length > 0) {
        const stamped = stamp(logs);
        for (let i = 0; i < stamped.length; i += 500) {
          const batch = stamped.slice(i, i + 500);
          const { error } = await supabase
            .from("daily_logs")
            .upsert(batch, { onConflict: "user_id,date" });
          if (error) {
            console.warn(`daily_logs batch ${i}: ${error.message}`);
            // Fallback: insert one-by-one, skip conflicts
            for (const row of batch) {
              await supabase.from("daily_logs").upsert(row, { onConflict: "user_id,date" }).then(({ error: e }) => {
                if (e) console.warn("Skipping log:", e.message);
              });
            }
          }
        }
      }

      // 4. Restore activity_logs
      const activities = pendingFile.activity_logs ?? [];
      if (activities.length > 0) {
        const stamped = stamp(activities);
        for (let i = 0; i < stamped.length; i += 500) {
          const batch = stamped.slice(i, i + 500);
          const { error } = await supabase.from("activity_logs").insert(batch);
          if (error) {
            console.warn(`activity_logs batch ${i}: ${error.message}`);
            for (const row of batch) {
              await supabase.from("activity_logs").insert(row).then(({ error: e }) => {
                if (e) console.warn("Skipping activity:", e.message);
              });
            }
          }
        }
      }

      // 5. Restore user_settings
      if (pendingFile.user_settings) {
        const row: Record<string, unknown> = { ...pendingFile.user_settings, user_id: userId };
        delete row.id;
        await supabase.from("user_settings").upsert(row, { onConflict: "user_id" });
      }

      setPendingFile(null);
      setPendingStats("");
      show("saved", "Restore complete! Reload the app to see changes.");

      // Clear caches so fresh data loads
      try {
        localStorage.removeItem("routines365:routineItems");
        window.dispatchEvent(new Event("routines365:routinesChanged"));
      } catch { /* ignore */ }

    } catch (e) {
      const msg = e instanceof Error ? e.message : "Restore failed";
      show("error", msg);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <Toast state={toast} message={toastMsg || undefined} />
      <SubPageHeader title="Backup & Restore" subtitle="Your data, your way" backHref="/app/settings" />

      {/* Cloud sync reassurance */}
      <section className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: "var(--accent-green-soft)", border: "1px solid var(--accent-green)" }}>
        <span className="text-lg shrink-0 mt-0.5">☁️</span>
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--accent-green-text)" }}>Cloud sync is automatic</p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Your data syncs to the cloud every time you use the app. Backups are an extra safety net for your records.
          </p>
        </div>
      </section>

      {/* Export */}
      <p className="text-xs font-bold uppercase tracking-wider px-1" style={{ color: "var(--text-faint)" }}>
        Export
      </p>

      <section className="card p-4 space-y-3">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Full backup (JSON)</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Everything — routines, checks, logs, settings — as one file.
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

      {/* Restore */}
      <p className="text-xs font-bold uppercase tracking-wider px-1" style={{ color: "var(--text-faint)" }}>
        Restore
      </p>

      <section className="card p-4 space-y-3">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Restore from backup</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Import a JSON backup file. This will replace all your current data with the contents of the backup.
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          type="button"
          className="btn-secondary w-full text-sm flex items-center justify-center gap-2"
          onClick={() => fileRef.current?.click()}
          disabled={!!busy}
        >
          {busy === "restore" ? <><Spinner size={14} /> Restoring…</> : "Select backup file"}
        </button>
      </section>

      {/* Confirm restore modal */}
      {confirmRestore && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl p-5 max-w-sm w-full space-y-4" style={{ background: "var(--bg-card)" }}>
            <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Confirm restore</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              This will <strong style={{ color: "var(--accent-red-text, #ef4444)" }}>replace all your current data</strong> with:
            </p>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{pendingStats}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Your existing routines, checks, logs, and activity data will be deleted first. Your account and settings will be preserved.
            </p>
            <div className="flex gap-3">
              <button type="button" className="btn-secondary flex-1 text-sm" onClick={() => { setConfirmRestore(false); setPendingFile(null); }}>
                Cancel
              </button>
              <button type="button" className="btn-primary flex-1 text-sm" onClick={doRestore}>
                Restore
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-center px-4 pb-8" style={{ color: "var(--text-faint)" }}>
        Your data is always stored securely in your account and syncs automatically across devices.
      </p>
    </div>
  );
}
