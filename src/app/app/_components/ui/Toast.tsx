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
      icon: <Loader2 size={16} className="animate-spin" />,
      text: "Saving…",
      bg: "var(--bg-card)",
      color: "var(--text-secondary)",
    },
    saved: {
      icon: <Check size={16} strokeWidth={3} />,
      text: message ?? "Saved ✓",
      bg: "var(--accent-green)",
      color: "var(--text-inverse)",
    },
    error: {
      icon: <AlertCircle size={14} />,
      text: message ?? "Save failed",
      bg: "var(--accent-red)",
      color: "var(--text-inverse)",
    },
    offline: {
      icon: <WifiOff size={16} />,
      text: queuedCount > 0 ? `Offline · ${queuedCount} queued` : "Offline",
      bg: "var(--accent-yellow)",
      color: "var(--text-inverse)",
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
      className={`fixed z-50 left-1/2 flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold shadow-xl transition-all duration-300 ${className}`}
      style={{
        bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
        transform: visible
          ? "translateX(-50%) translateY(0) scale(1)"
          : "translateX(-50%) translateY(16px) scale(0.95)",
        background: config.bg,
        color: config.color,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        minWidth: "140px",
        maxWidth: "85vw",
      }}
      role="status"
      aria-live="polite"
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}
