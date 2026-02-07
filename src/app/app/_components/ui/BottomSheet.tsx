"use client";

import { useEffect, useRef, useCallback } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({ open, onClose, title, children, className = "" }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Trap focus and handle Escape
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    // Prevent body scroll when sheet is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Focus the sheet when it opens
  useEffect(() => {
    if (open && sheetRef.current) {
      sheetRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end animate-fade-in"
      style={{ background: "var(--bg-overlay)" }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        tabIndex={-1}
        className={`w-full max-w-md mx-auto rounded-t-2xl p-4 animate-slide-up outline-none ${className}`}
        style={{
          background: "var(--bg-sheet)",
          border: "1px solid var(--border-primary)",
          borderBottom: "none",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center mb-3">
          <div
            className="h-1 w-10 rounded-full"
            style={{ background: "var(--border-primary)" }}
          />
        </div>

        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Close
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
