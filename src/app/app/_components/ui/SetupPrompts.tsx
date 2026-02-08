"use client";

import { useEffect, useState } from "react";
import { Bell, Heart, X, Check } from "lucide-react";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { isNativeNotifyAvailable, scheduleCheckInReminder, scheduleStreakReminder } from "@/lib/nativeNotify";
import { isHealthKitAvailable, requestHealthKitAuth } from "@/lib/healthKit";

const LS_KEY = "routines365:setupPrompts:dismissed";
const LS_TIPS_KEY = "routines365:tips:dismissed";

interface PromptItem {
  id: string;
  icon: typeof Bell;
  iconColor: string;
  iconBg: string;
  title: string;
  desc: string;
  action: () => Promise<boolean>;
  actionLabel: string;
  native?: boolean; // only show in native app
}

/**
 * Shows setup prompts after onboarding tips are dismissed.
 * Nudges users toward notifications and Apple Health.
 * Only shows once, dismissible, and only relevant prompts.
 */
export function SetupPrompts() {
  const [visible, setVisible] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    // Only show if tips have been dismissed but setup hasn't been
    const tipsDismissed = localStorage.getItem(LS_TIPS_KEY) === "1";
    const setupDismissed = localStorage.getItem(LS_KEY) === "1";
    if (tipsDismissed && !setupDismissed) {
      setTimeout(() => setVisible(true), 800);
    }
  }, []);

  const dismiss = () => {
    hapticLight();
    localStorage.setItem(LS_KEY, "1");
    setVisible(false);
  };

  const handleAction = async (prompt: PromptItem) => {
    setBusy(prompt.id);
    hapticMedium();
    try {
      const ok = await prompt.action();
      if (ok) {
        setCompleted((prev) => new Set([...prev, prompt.id]));
      }
    } catch { /* ignore */ }
    setBusy(null);
  };

  if (!visible) return null;

  const isNative = typeof window !== "undefined" && !!(window as unknown as Record<string, unknown>).Capacitor;
  const nativeNotify = isNativeNotifyAvailable();
  const nativeHealth = isHealthKitAvailable();

  const prompts: PromptItem[] = [
    ...(nativeNotify ? [{
      id: "notifications",
      icon: Bell,
      iconColor: "#3b82f6",
      iconBg: "rgba(59,130,246,0.1)",
      title: "Enable reminders",
      desc: "Get a morning nudge to check in and an evening streak alert.",
      action: async () => {
        const ok1 = await scheduleCheckInReminder(9, 0);
        if (ok1) await scheduleStreakReminder(20, 0);
        // Save settings
        try {
          localStorage.setItem("routines365:notifications", JSON.stringify({
            checkIn: true, checkInHour: 9, checkInMinute: 0,
            streakReminder: true, streakHour: 20, streakMinute: 0,
          }));
        } catch {}
        return ok1;
      },
      actionLabel: "Turn on",
    }] : []),
    ...(nativeHealth ? [{
      id: "health",
      icon: Heart,
      iconColor: "#ef4444",
      iconBg: "rgba(239,68,68,0.1)",
      title: "Connect Apple Health",
      desc: "Auto-track steps, sleep, and workouts without manual entry.",
      action: async () => {
        return await requestHealthKitAuth();
      },
      actionLabel: "Connect",
    }] : []),
  ];

  // Nothing to show (web users)
  if (prompts.length === 0) {
    localStorage.setItem(LS_KEY, "1");
    return null;
  }

  // All completed
  const allDone = prompts.every((p) => completed.has(p.id));
  if (allDone) {
    // Auto-dismiss after a moment
    setTimeout(() => {
      localStorage.setItem(LS_KEY, "1");
      setVisible(false);
    }, 1500);
  }

  return (
    <div className="rounded-2xl p-4 animate-fade-in"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
          {allDone ? "✅ All set!" : "Quick setup"}
        </p>
        <button type="button" onClick={dismiss}
          className="p-1.5 rounded-full" style={{ color: "var(--text-faint)" }}>
          <X size={14} />
        </button>
      </div>

      <div className="space-y-3">
        {prompts.map((prompt) => {
          const Icon = prompt.icon;
          const isDone = completed.has(prompt.id);
          const isBusy = busy === prompt.id;

          return (
            <div key={prompt.id} className="flex items-center gap-3">
              <div className="shrink-0 flex items-center justify-center rounded-xl"
                style={{
                  width: 40, height: 40,
                  background: isDone ? "rgba(16,185,129,0.1)" : prompt.iconBg,
                }}>
                {isDone
                  ? <Check size={18} style={{ color: "#10b981" }} />
                  : <Icon size={18} style={{ color: prompt.iconColor }} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{
                  color: isDone ? "var(--text-faint)" : "var(--text-primary)",
                  textDecoration: isDone ? "line-through" : "none",
                }}>
                  {prompt.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {prompt.desc}
                </p>
              </div>
              {!isDone && (
                <button type="button" onClick={() => void handleAction(prompt)}
                  disabled={isBusy}
                  className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-[0.96] disabled:opacity-60"
                  style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>
                  {isBusy ? "…" : prompt.actionLabel}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
