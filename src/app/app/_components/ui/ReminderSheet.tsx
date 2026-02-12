"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Bell, BellOff, Trash2, X, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { upsertReminder, deleteReminder, subscribeToPush, getPushPermission, isPushSupported } from "@/lib/reminders";
import {
  scheduleDailyReminder,
  cancelReminder as cancelNativeReminder,
  requestNotifyPermission,
  isNativeNotifyAvailable,
  getNotifyPermissionStatus,
  listPendingNotifications,
} from "@/lib/nativeNotify";
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
  const [days, setDays] = useState<number[]>(existing?.days_of_week ?? [1, 2, 3, 4, 5]);
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pushSupported, setPushSupported] = useState(true);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [isNative, setIsNative] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "warning" | "error"; msg: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Portal mount
  useEffect(() => { setMounted(true); }, []);

  // Scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (open) {
      setTime(existing?.time ?? "09:00");
      setDays(existing?.days_of_week ?? [1, 2, 3, 4, 5]);
      setEnabled(existing?.enabled ?? true);
      setStatus(null);
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
    setStatus(null);
    hapticMedium();

    try {
      if (!isNative && pushPermission !== "granted") {
        const ok = await subscribeToPush();
        if (!ok) {
          setStatus({ type: "error", msg: "Notification permission denied. Enable in Settings \u2192 Notifications." });
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

      if (isNative && enabled) {
        const pluginAvailable = isNativeNotifyAvailable();
        if (!pluginAvailable) {
          setStatus({ type: "warning", msg: "Reminder saved but notifications unavailable." });
          onSaved?.();
          setTimeout(onClose, 2500);
          setSaving(false);
          return;
        }

        const granted = await requestNotifyPermission();
        if (!granted) {
          const permStatus = await getNotifyPermissionStatus();
          if (permStatus === "denied") {
            setStatus({ type: "error", msg: "Notifications blocked. Go to iPhone Settings \u2192 Routines365 \u2192 Notifications \u2192 Allow." });
          } else {
            setStatus({ type: "warning", msg: "Notification permission not granted. Please allow when prompted." });
          }
          onSaved?.();
          setSaving(false);
          return;
        }

        await cancelNativeReminder(`habit_${routineItemId}`);
        const [h, m] = time.split(":").map(Number);
        const scheduled = await scheduleDailyReminder({
          id: `habit_${routineItemId}`,
          title: `${routineEmoji ?? "\u23F0"} ${routineLabel}`,
          body: "Time for your habit!",
          hour: h,
          minute: m,
          weekdays: days,
        });

        if (scheduled) {
          const pending = await listPendingNotifications();
          const found = pending.some((n) => n.id.startsWith(`habit_${routineItemId}`));
          setStatus({ type: "success", msg: found
            ? `Reminder set for ${formatTime(h, m)}`
            : "Reminder saved but may not fire. Check iPhone Settings." });
        } else {
          setStatus({ type: "error", msg: "Failed to schedule. Check iPhone Settings \u2192 Routines365 \u2192 Notifications." });
          onSaved?.();
          setSaving(false);
          return;
        }
      } else if (isNative && !enabled) {
        await cancelNativeReminder(`habit_${routineItemId}`);
        setStatus({ type: "success", msg: "Reminder paused" });
      } else {
        setStatus({ type: "success", msg: "Reminder saved" });
      }

      onSaved?.();
      setTimeout(onClose, 1200);
    } catch (e) {
      console.error("Failed to save reminder:", e);
      setStatus({ type: "error", msg: "Something went wrong. Please try again." });
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
      if (isNativeNotifyAvailable()) {
        await cancelNativeReminder(`habit_${routineItemId}`);
      }
      onSaved?.();
      onClose();
    } catch (e) {
      console.error("Failed to delete reminder:", e);
    } finally {
      setDeleting(false);
    }
  };

  if (!open || !mounted) return null;

  const sheet = (
    <div
      className="fixed inset-0 z-[9999] flex items-end"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        className="w-full max-w-md mx-auto rounded-t-2xl"
        style={{
          background: "var(--bg-sheet)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
          maxHeight: "85vh",
          overflowY: "auto",
          animation: "slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1.5 w-10 rounded-full" style={{ background: "var(--border-primary)" }} />
        </div>

        <div className="px-5 pb-5" style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
          {/* Header + close */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell size={18} style={{ color: "var(--accent-green)" }} />
              <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                Set Reminder
              </h3>
            </div>
            <button type="button" onClick={onClose}
              className="rounded-full p-2.5"
              style={{ background: "var(--bg-card-hover)" }}>
              <X size={18} style={{ color: "var(--text-muted)" }} />
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

          {/* Status feedback */}
          {status && (
            <div className="rounded-xl px-3 py-2.5 mb-4 flex items-center gap-2 text-xs font-medium"
              style={{
                background: status.type === "success"
                  ? "rgba(16,185,129,0.12)"
                  : status.type === "warning"
                  ? "rgba(245,158,11,0.12)"
                  : "rgba(239,68,68,0.12)",
                color: status.type === "success"
                  ? "#34d399"
                  : status.type === "warning"
                  ? "#fbbf24"
                  : "#fca5a5",
              }}>
              {status.type === "success"
                ? <CheckCircle size={14} className="shrink-0" />
                : <AlertTriangle size={14} className="shrink-0" />}
              {status.msg}
            </div>
          )}

          {/* Push not supported warning */}
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
              className="w-full rounded-xl px-4 py-3 text-base font-medium outline-none"
              style={{
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-primary)",
                boxSizing: "border-box",
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
              {saving ? "Saving\u2026" : existing ? "Update Reminder" : "Set Reminder"}
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
    </div>
  );

  // Render via portal to escape any parent transforms
  return createPortal(sheet, document.body);
}

function formatTime(h: number, m: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}
