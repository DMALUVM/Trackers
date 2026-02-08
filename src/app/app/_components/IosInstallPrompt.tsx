"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Share, Plus, MoreVertical, ArrowDown } from "lucide-react";
import { hapticLight } from "@/lib/haptics";

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isAndroid() {
  if (typeof navigator === "undefined") return false;
  return /Android/.test(navigator.userAgent);
}

function isSafari() {
  if (typeof navigator === "undefined") return false;
  return !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
}

function isChrome() {
  if (typeof navigator === "undefined") return false;
  return /Chrome/.test(navigator.userAgent) && !/EdgiOS|Edge/.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  // @ts-expect-error - nonstandard
  const navStandalone = typeof navigator !== "undefined" && navigator.standalone;
  const mm = window.matchMedia?.("(display-mode: standalone)")?.matches;
  // Running inside Capacitor native shell
  // @ts-expect-error - Capacitor global
  const isCapacitor = typeof window !== "undefined" && !!window.Capacitor;
  return Boolean(navStandalone || mm || isCapacitor);
}

export function IosInstallPrompt() {
  const [dismissed, setDismissed] = useState(true);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem("routines365:installPrompt:dismissed") === "1");
    } catch {
      setDismissed(true);
    }
  }, []);

  const platform = useMemo(() => {
    if (isIos() && isSafari()) return "ios-safari";
    if (isIos() && !isSafari()) return "ios-other";
    if (isAndroid() && isChrome()) return "android-chrome";
    if (isAndroid()) return "android-other";
    return "desktop";
  }, []);

  const shouldShow = useMemo(
    () => !dismissed && !isStandalone() && platform !== "desktop",
    [dismissed, platform]
  );

  if (!shouldShow) return null;

  const dismiss = () => {
    localStorage.setItem("routines365:installPrompt:dismissed", "1");
    setDismissed(true);
  };

  const isIosSafari = platform === "ios-safari";
  const isIosOther = platform === "ios-other";
  const isAndroidChrome = platform === "android-chrome";

  const steps = isIosSafari
    ? [
        {
          icon: <Share size={28} style={{ color: "var(--accent-green)" }} />,
          title: "Tap the Share button",
          desc: "It's at the bottom of Safari (the square with an arrow pointing up)",
        },
        {
          icon: <Plus size={28} style={{ color: "var(--accent-green)" }} />,
          title: 'Scroll down and tap "Add to Home Screen"',
          desc: "You may need to scroll the menu to find it",
        },
        {
          icon: <span className="text-2xl">✅</span>,
          title: 'Tap "Add" in the top right',
          desc: "The app will appear on your home screen like a regular app!",
        },
      ]
    : isAndroidChrome
    ? [
        {
          icon: <MoreVertical size={28} style={{ color: "var(--accent-green)" }} />,
          title: "Tap the ⋮ menu",
          desc: "Three dots in the top-right corner of Chrome",
        },
        {
          icon: <ArrowDown size={28} style={{ color: "var(--accent-green)" }} />,
          title: '"Install app" or "Add to Home screen"',
          desc: "Tap it and confirm when prompted",
        },
        {
          icon: <span className="text-2xl">✅</span>,
          title: "Done!",
          desc: "The app will appear on your home screen like a regular app!",
        },
      ]
    : [];

  // If not Safari on iOS, show a message to open in Safari
  if (isIosOther) {
    return (
      <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.7)" }}>
        <div
          className="w-full max-w-md mx-auto rounded-t-3xl p-6 pb-10 animate-slide-up"
          style={{ background: "var(--bg-sheet)", borderTop: "2px solid var(--accent-green)" }}
        >
          <div className="flex justify-between items-start mb-5">
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              📱 Install the App
            </h2>
            <button type="button" onClick={dismiss} className="rounded-full p-2" style={{ background: "var(--bg-card-hover)" }}>
              <X size={18} style={{ color: "var(--text-muted)" }} />
            </button>
          </div>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            To install this app on your iPhone, open it in <strong style={{ color: "var(--text-primary)" }}>Safari</strong> instead
            of this browser. Copy the URL and paste it in Safari, then follow the instructions to add it to your home screen.
          </p>
          <button type="button" onClick={dismiss}
            className="mt-6 w-full rounded-xl py-4 text-base font-bold transition-all active:scale-[0.98]"
            style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>
            Got it
          </button>
        </div>
      </div>
    );
  }

  if (steps.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div
        className="w-full max-w-md mx-auto rounded-t-3xl p-6 pb-10 animate-slide-up"
        style={{ background: "var(--bg-sheet)", borderTop: "2px solid var(--accent-green)" }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            📱 Install the App
          </h2>
          <button type="button" onClick={dismiss} className="rounded-full p-2" style={{ background: "var(--bg-card-hover)" }}>
            <X size={18} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>
        <p className="text-base mb-6" style={{ color: "var(--text-muted)" }}>
          Add to your home screen for the best experience — launches full screen, just like a real app.
        </p>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { hapticLight(); setStep(i); }}
              className="w-full flex items-start gap-4 rounded-2xl p-4 text-left transition-all"
              style={{
                background: step === i ? "var(--accent-green-soft)" : "var(--bg-card)",
                border: `1.5px solid ${step === i ? "var(--accent-green)" : "var(--border-primary)"}`,
              }}
            >
              {/* Step number */}
              <div
                className="shrink-0 flex items-center justify-center rounded-full font-bold"
                style={{
                  width: 36,
                  height: 36,
                  fontSize: "1rem",
                  background: step === i ? "var(--accent-green)" : "var(--bg-card-hover)",
                  color: step === i ? "var(--text-inverse)" : "var(--text-muted)",
                }}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  {s.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {s.desc}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={dismiss}
            className="flex-1 rounded-xl py-4 text-base font-bold transition-all active:scale-[0.98]"
            style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}
          >
            Got it, thanks!
          </button>
        </div>

        <button type="button" onClick={dismiss}
          className="mt-3 w-full text-center text-sm py-2"
          style={{ color: "var(--text-faint)" }}>
          Skip for now
        </button>
      </div>
    </div>
  );
}
