"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Clock, Flame, Check } from "lucide-react";
import { SubPageHeader } from "@/app/app/_components/ui/SubPageHeader";
import { hapticMedium, hapticLight } from "@/lib/haptics";
import {
  isNativeNotifyAvailable,
  getNotifyPermissionStatus,
  scheduleCheckInReminder,
  scheduleStreakReminder,
  cancelReminder,
} from "@/lib/nativeNotify";

const LS_KEY = "routines365:notifications";

interface NotifySettings {
  checkIn: boolean;
  checkInHour: number;
  checkInMinute: number;
  streakReminder: boolean;
  streakHour: number;
  streakMinute: number;
}

const DEFAULTS: NotifySettings = {
  checkIn: false,
  checkInHour: 9,
  checkInMinute: 0,
  streakReminder: false,
  streakHour: 20,
  streakMinute: 0,
};

function loadSettings(): NotifySettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULTS;
}

function saveSettings(s: NotifySettings) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
}

function formatTime(h: number, m: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export default function NotificationsPage() {
  const [native, setNative] = useState(false);
  const [permission, setPermission] = useState("unknown");
  const [settings, setSettings] = useState<NotifySettings>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const avail = isNativeNotifyAvailable();
    setNative(avail);
    setSettings(loadSettings());
    if (avail) {
      void getNotifyPermissionStatus().then(setPermission);
    }
  }, []);

  const updateSetting = <K extends keyof NotifySettings>(key: K, value: NotifySettings[K]) => {
    hapticLight();
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
  };

  const applyNotifications = async () => {
    hapticMedium();

    if (settings.checkIn) {
      const ok = await scheduleCheckInReminder(settings.checkInHour, settings.checkInMinute);
      if (!ok) {
        setPermission("denied");
        return;
      }
    } else {
      await cancelReminder("daily_checkin");
    }

    if (settings.streakReminder) {
      await scheduleStreakReminder(settings.streakHour, settings.streakMinute);
    } else {
      await cancelReminder("streak_reminder");
    }

    const status = await getNotifyPermissionStatus();
    setPermission(status);
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!native) {
    return (
      <div className="space-y-6">
        <SubPageHeader title="Notifications" subtitle="Daily reminders" />
        <div className="rounded-2xl p-5 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <Bell size={32} className="mx-auto mb-3" style={{ color: "var(--text-faint)" }} />
          <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Notifications require the native app
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Install Routines365 from the App Store to get daily check-in reminders and streak alerts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SubPageHeader title="Notifications" subtitle="Daily reminders" />

      {permission === "denied" && (
        <div className="rounded-2xl p-4"
          style={{ background: "var(--accent-red-soft)", border: "1px solid var(--accent-red)" }}>
          <div className="flex items-center gap-3">
            <BellOff size={20} style={{ color: "var(--accent-red-text)" }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--accent-red-text)" }}>
                Notifications blocked
              </p>
              <p className="text-xs" style={{ color: "var(--accent-red-text)", opacity: 0.7 }}>
                Go to iPhone Settings → Routines365 → Notifications to enable
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Morning check-in */}
      <div className="rounded-2xl p-5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="shrink-0 flex items-center justify-center rounded-xl"
              style={{ width: 44, height: 44, background: "rgba(59,130,246,0.1)" }}>
              <Clock size={20} style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Morning check-in
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                &quot;Time to check in ✅&quot;
              </p>
            </div>
          </div>
          <button type="button"
            onClick={() => updateSetting("checkIn", !settings.checkIn)}
            className="relative rounded-full transition-all duration-200"
            style={{
              width: 50, height: 30,
              background: settings.checkIn ? "var(--accent-green)" : "var(--bg-card-hover)",
              border: `2px solid ${settings.checkIn ? "var(--accent-green)" : "var(--border-primary)"}`,
            }}>
            <div className="absolute top-0.5 rounded-full bg-white transition-all duration-200"
              style={{
                width: 22, height: 22,
                left: settings.checkIn ? 22 : 2,
              }} />
          </button>
        </div>

        {settings.checkIn && (
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-primary)" }}>
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
              Remind at
            </label>
            <input
              type="time"
              value={`${settings.checkInHour.toString().padStart(2, "0")}:${settings.checkInMinute.toString().padStart(2, "0")}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(":").map(Number);
                updateSetting("checkInHour", h);
                updateSetting("checkInMinute", m);
              }}
              className="mt-2 w-full rounded-xl px-4 py-3 text-base font-semibold"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
              }}
            />
            <p className="mt-1.5 text-xs" style={{ color: "var(--text-faint)" }}>
              Currently: {formatTime(settings.checkInHour, settings.checkInMinute)}
            </p>
          </div>
        )}
      </div>

      {/* Streak reminder */}
      <div className="rounded-2xl p-5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="shrink-0 flex items-center justify-center rounded-xl"
              style={{ width: 44, height: 44, background: "rgba(249,115,22,0.1)" }}>
              <Flame size={20} style={{ color: "#f97316" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Streak protector
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                &quot;Don&apos;t break your streak! 🔥&quot;
              </p>
            </div>
          </div>
          <button type="button"
            onClick={() => updateSetting("streakReminder", !settings.streakReminder)}
            className="relative rounded-full transition-all duration-200"
            style={{
              width: 50, height: 30,
              background: settings.streakReminder ? "var(--accent-green)" : "var(--bg-card-hover)",
              border: `2px solid ${settings.streakReminder ? "var(--accent-green)" : "var(--border-primary)"}`,
            }}>
            <div className="absolute top-0.5 rounded-full bg-white transition-all duration-200"
              style={{
                width: 22, height: 22,
                left: settings.streakReminder ? 22 : 2,
              }} />
          </button>
        </div>

        {settings.streakReminder && (
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-primary)" }}>
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
              Remind at
            </label>
            <input
              type="time"
              value={`${settings.streakHour.toString().padStart(2, "0")}:${settings.streakMinute.toString().padStart(2, "0")}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(":").map(Number);
                updateSetting("streakHour", h);
                updateSetting("streakMinute", m);
              }}
              className="mt-2 w-full rounded-xl px-4 py-3 text-base font-semibold"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
              }}
            />
            <p className="mt-1.5 text-xs" style={{ color: "var(--text-faint)" }}>
              Evening nudge at {formatTime(settings.streakHour, settings.streakMinute)}
            </p>
          </div>
        )}
      </div>

      {/* Save button */}
      <button type="button" onClick={applyNotifications}
        className="w-full rounded-xl py-3.5 text-base font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>
        {saved ? <><Check size={16} /> Saved!</> : <><Bell size={16} /> Save & apply</>}
      </button>

      <p className="text-[10px] text-center" style={{ color: "var(--text-faint)" }}>
        Notifications are local to this device. No data is sent to our servers.
      </p>
    </div>
  );
}
