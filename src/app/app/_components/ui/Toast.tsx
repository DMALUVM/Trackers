"use client";

import { useEffect, useState } from "react";
import { Check, AlertCircle, Loader2, WifiOff } from "lucide-react";

export type ToastState = "idle" | "saving" | "saved" | "error" | "offline";

interface ToastProps {
  state: ToastState;
  message?: string;
  queuedCount?: number;
  className?: string;
}

export function Toast({ state, message, queuedCount = 0, className = "" }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [displayState, setDisplayState] = useState<ToastState>(state);

  useEffect(() => {
    if (state === "idle") {
      // Fade out after saved
      const t = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(t);
    }
    setDisplayState(state);
    setVisible(true);
  }, [state]);

  if (!visible && state === "idle") return null;

  const config = {
    saving: {
      icon: <Loader2 size={14} className="animate-spin" />,
      text: "Saving…",
      bg: "var(--bg-card)",
      color: "var(--text-secondary)",
    },
    saved: {
      icon: <Check size={14} />,
      text: message ?? "Saved",
      bg: "var(--accent-green-soft)",
      color: "var(--accent-green-text)",
    },
    error: {
      icon: <AlertCircle size={14} />,
      text: message ?? "Save failed",
      bg: "var(--accent-red-soft)",
      color: "var(--accent-red-text)",
    },
    offline: {
      icon: <WifiOff size={14} />,
      text: queuedCount > 0 ? `Offline (${queuedCount} queued)` : "Offline",
      bg: "var(--accent-yellow-soft)",
      color: "var(--accent-yellow-text)",
    },
    idle: {
      icon: null,
      text: "",
      bg: "transparent",
      color: "transparent",
    },
  }[displayState];

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg transition-all duration-300 ${className}`}
      style={{
        background: config.bg,
        color: config.color,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-8px)",
        border: `1px solid ${displayState === "idle" ? "transparent" : "var(--border-primary)"}`,
      }}
      role="status"
      aria-live="polite"
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}
