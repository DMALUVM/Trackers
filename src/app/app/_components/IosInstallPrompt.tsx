"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Share } from "lucide-react";

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isSafari() {
  if (typeof navigator === "undefined") return false;
  return !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  // @ts-expect-error - nonstandard
  const navStandalone = typeof navigator !== "undefined" && navigator.standalone;
  const mm = window.matchMedia?.("(display-mode: standalone)")?.matches;
  return Boolean(navStandalone || mm);
}

export function IosInstallPrompt() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try { setDismissed(localStorage.getItem("routines365:iosInstallPrompt:dismissed") === "1"); }
    catch { setDismissed(true); }
  }, []);

  const shouldShow = useMemo(() => !dismissed && isIos() && isSafari() && !isStandalone(), [dismissed]);
  if (!shouldShow) return null;

  const dismiss = () => {
    localStorage.setItem("routines365:iosInstallPrompt:dismissed", "1");
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 px-4 animate-fade-in-up">
      <div className="mx-auto w-full max-w-md rounded-2xl p-4 shadow-lg"
        style={{ background: "var(--bg-sheet)", border: "1px solid var(--border-primary)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-start gap-3">
          <div className="shrink-0 flex items-center justify-center rounded-xl"
            style={{ width: 40, height: 40, background: "var(--accent-green-soft)" }}>
            <Share size={18} style={{ color: "var(--accent-green-text)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Add to Home Screen</p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Tap Share → <strong>Add to Home Screen</strong> for the best experience.
            </p>
          </div>
          <button type="button" className="shrink-0 rounded-full p-1.5 transition-colors"
            style={{ color: "var(--text-faint)" }}
            onClick={dismiss} aria-label="Dismiss">
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
