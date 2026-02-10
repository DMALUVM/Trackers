"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Trash2, X } from "lucide-react";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { upsertReminder, deleteReminder, subscribeToPush, getPushPermission, isPushSupported } from "@/lib/reminders";
import type { Reminder } from "@/lib/reminders";

const DAYS = [
  { iso: 1, short: "M" },
  { iso: 2, short: "T" },
  { iso: 3, short: "W" },
  { iso: 4, short: "T" },
  { iso: 5, short: "F" },
  { iso: 6, short: "S" },
  { iso: 7, short: "S" },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  routineItemId: string;
  routineLabel: string;
  routineEmoji?: string;
  existing?: Reminder | null;
  onSaved?: () => void;
}

export function ReminderSheet({
  open, onClose, routineItemId, routineLabel, routineEmoji, existing, onSaved,
}: Props) {
  const [time, setTime] = useState(existing?.time ?? "09:00");
  const [days, setDays] = useState<number[]>(existing?.days_of_week ?? [1, 2, 3, 4, 5]); // Default weekdays
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pushSupported, setPushSupported] = useState(true);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (open) {
      setTime(existing?.time ?? "09:00");
      setDays(existing?.days_of_week ?? [1, 2, 3, 4, 5]);
      setEnabled(existing?.enabled ?? true);
      // Check if running in native Capacitor app
      // @ts-expect-error - Capacitor global
      const native = !!window.Capacitor;
      setIsNative(native);
      if (!native) {
        isPushSupported().then(setPushSupported);
        getPushPermission().then(setPushPermission);
      }
    }
  }, [open, existing]);

  const toggleDay = useCallback((iso: number) => {
    hapticLight();
    setDays((prev) =>
      prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso].sort()
    );
  }, []);

  const handleSave = async () => {
    if (days.length === 0 || saving) return;
    setSaving(true);
    hapticMedium();

    try {
      // In native app, skip web push — save reminder directly
      // In web, try to get push permission first
      if (!isNative && pushPermission !== "granted") {
        const ok = await subscribeToPush();
        if (!ok) {
          setSaving(false);
          return;
        }
        setPushPermission("granted");
      }

      await upsertReminder({
        routineItemId,
        time,
        daysOfWeek: days,
        enabled,
      });
      onSaved?.();
      onClose();
    } catch (e) {
      console.error("Failed to save reminder:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    hapticMedium();
    try {
      await deleteReminder(routineItemId);
      onSaved?.();
      onClose();
    } catch (e) {
      console.error("Failed to delete reminder:", e);
    } finally {
      setDeleting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose} />

      {/* Modal — bottom-anchored on mobile for keyboard */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
        <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 pb-8 sm:pb-5 animate-fade-in-up"
          style={{ background: "var(--bg-sheet)", border: "1px solid var(--border-primary)", boxShadow: "0 -4px 32px rgba(0,0,0,0.3)" }}
          onClick={(e) => e.stopPropagation()}>

          {/* Handle + close */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell size={18} style={{ color: "var(--accent-green)" }} />
              <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                Set Reminder
              </h3>
            </div>
            <button type="button" onClick={onClose}
              className="rounded-full p-1.5"
              style={{ background: "var(--bg-card-hover)" }}>
              <X size={16} style={{ color: "var(--text-muted)" }} />
            </button>
          </div>

          {/* Routine info */}
          <div className="rounded-xl px-3 py-2.5 mb-4"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {routineEmoji && <span className="mr-1.5">{routineEmoji}</span>}
              {routineLabel}
            </p>
          </div>

          {/* Push not supported warning — only on web, never in native app */}
          {!isNative && !pushSupported && (
            <div className="rounded-xl px-3 py-2.5 mb-4 text-xs"
              style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5" }}>
              Push notifications aren&apos;t available in this browser.
              Try opening the app from your home screen.
            </div>
          )}

          {/* Time picker */}
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--text-muted)" }}>
              Remind at
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-base font-medium outline-none transition"
              style={{
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-primary)",
              }}
            />
          </div>

          {/* Day selector */}
          <div className="mb-5">
            <label className="block text-xs font-semibold mb-2"
              style={{ color: "var(--text-muted)" }}>
              On these days
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS.map(({ iso, short }) => {
                const active = days.includes(iso);
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => toggleDay(iso)}
                    className="flex items-center justify-center rounded-xl py-2.5 text-sm font-bold transition-all"
                    style={{
                      background: active ? "var(--accent-green)" : "var(--bg-primary)",
                      color: active ? "var(--text-inverse)" : "var(--text-muted)",
                      border: `1px solid ${active ? "var(--accent-green)" : "var(--border-primary)"}`,
                    }}>
                    {short}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enable/disable toggle for existing */}
          {existing && (
            <div className="flex items-center justify-between mb-4 rounded-xl px-3 py-2.5"
              style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)" }}>
              <div className="flex items-center gap-2">
                {enabled ? <Bell size={16} style={{ color: "var(--accent-green)" }} /> : <BellOff size={16} style={{ color: "var(--text-muted)" }} />}
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {enabled ? "Reminder active" : "Reminder paused"}
                </span>
              </div>
              <button type="button"
                onClick={() => { setEnabled(!enabled); hapticLight(); }}
                className="relative h-7 w-12 rounded-full transition-colors duration-200"
                style={{ background: enabled ? "var(--accent-green)" : "var(--bg-card-hover)" }}>
                <div className="absolute top-0.5 h-6 w-6 rounded-full shadow transition-transform duration-200"
                  style={{
                    background: "#fff",
                    transform: enabled ? "translateX(22px)" : "translateX(2px)",
                  }} />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button type="button"
              onClick={handleSave}
              disabled={saving || days.length === 0}
              className="flex-1 rounded-xl py-3 text-sm font-bold transition-all active:scale-[0.98]"
              style={{
                background: days.length === 0 ? "var(--bg-card-hover)" : "var(--accent-green)",
                color: days.length === 0 ? "var(--text-muted)" : "var(--text-inverse)",
                opacity: saving ? 0.6 : 1,
              }}>
              {saving ? "Saving…" : existing ? "Update Reminder" : "Set Reminder"}
            </button>

            {existing && (
              <button type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl px-4 py-3 transition-all active:scale-[0.98]"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: "#f87171",
                  opacity: deleting ? 0.6 : 1,
                }}>
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
