"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({ open, onClose, title, children, className = "" }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{ y: number; time: number } | null>(null);

  // Keyboard + body scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  // Focus sheet
  useEffect(() => { if (open && sheetRef.current) sheetRef.current.focus(); }, [open]);

  // Reset drag on close
  useEffect(() => { if (!open) { setDragY(0); setDragging(false); } }, [open]);

  // Drag-to-dismiss handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    // Only drag from the handle area or when sheet is scrolled to top
    const sheet = sheetRef.current;
    if (sheet && sheet.scrollTop > 0 && !target.closest("[data-drag-handle]")) return;
    dragStartRef.current = { y: e.touches[0].clientY, time: Date.now() };
    setDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragStartRef.current) return;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    // Only allow downward drag
    if (dy > 0) {
      setDragY(dy);
      // Prevent scroll while dragging
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!dragStartRef.current) return;
    const elapsed = Date.now() - dragStartRef.current.time;
    const velocity = dragY / Math.max(elapsed, 1);
    // Dismiss if dragged >100px or fast flick
    if (dragY > 100 || (velocity > 0.5 && dragY > 30)) {
      onClose();
    }
    setDragY(0);
    setDragging(false);
    dragStartRef.current = null;
  }, [dragY, onClose]);

  if (!open) return null;

  const dismissProgress = Math.min(dragY / 300, 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: `rgba(0,0,0,${0.5 * (1 - dismissProgress)})`, transition: dragging ? "none" : "background 0.2s" }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        tabIndex={-1}
        className={`w-full max-w-md mx-auto rounded-t-2xl outline-none ${className}`}
        style={{
          background: "var(--bg-sheet)",
          border: "1px solid var(--border-primary)",
          borderBottom: "none",
          maxHeight: "85vh",
          overflowY: dragging ? "hidden" : "auto",
          transform: `translateY(${dragY}px)`,
          transition: dragging ? "none" : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          animation: dragY === 0 && !dragging ? "slide-up 0.32s cubic-bezier(0.32, 0.72, 0, 1)" : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 cursor-grab" data-drag-handle>
          <div className="h-1.5 w-10 rounded-full" style={{ background: "var(--border-primary)" }} />
        </div>

        <div className="px-4 pb-4">
          {title && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
              <button type="button" onClick={onClose}
                className="rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ background: "var(--bg-card-hover)", color: "var(--text-muted)" }}>
                Done
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
