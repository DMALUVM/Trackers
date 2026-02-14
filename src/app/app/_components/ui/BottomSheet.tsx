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
  const handleRef = useRef<HTMLDivElement>(null);
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

  // Reset drag on close
  useEffect(() => { if (!open) { setDragY(0); setDragging(false); } }, [open]);

  // Drag-to-dismiss — ONLY from the handle area
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartRef.current = { y: e.touches[0].clientY, time: Date.now() };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragStartRef.current) return;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    if (dy > 8) {
      if (!dragging) setDragging(true);
      setDragY(dy);
      e.preventDefault();
    }
  }, [dragging]);

  const handleTouchEnd = useCallback(() => {
    if (!dragStartRef.current) { setDragging(false); return; }
    const elapsed = Date.now() - dragStartRef.current.time;
    const velocity = dragY / Math.max(elapsed, 1);
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
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-end",
        background: `rgba(0,0,0,${0.5 * (1 - dismissProgress)})`,
        transition: dragging ? "none" : "background 0.2s",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={className}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 448,
          margin: "0 auto",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-sheet, #fff)",
          borderRadius: "16px 16px 0 0",
          border: "1px solid var(--border-primary)",
          borderBottom: "none",
          outline: "none",
          transform: `translateY(${dragY}px)`,
          transition: dragging ? "none" : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          animation: dragY === 0 && !dragging ? "slide-up 0.32s cubic-bezier(0.32, 0.72, 0, 1)" : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — ONLY this area triggers drag-to-dismiss */}
        <div
          ref={handleRef}
          style={{ flexShrink: 0, cursor: "grab", padding: title ? "12px 16px 16px" : "12px 16px 8px" }}
          data-drag-handle
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: title ? 8 : 0 }}>
            <div style={{ height: 6, width: 40, borderRadius: 999, background: "var(--border-primary)" }} />
          </div>
          {title && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
              <button type="button" onClick={onClose}
                className="rounded-full px-3.5 py-2 text-xs font-semibold"
                style={{ background: "var(--bg-card-hover)", color: "var(--text-muted)" }}>
                Done
              </button>
            </div>
          )}
        </div>

        {/* Scrollable content — minHeight:0 is critical for flex overflow */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch" as any,
            overscrollBehavior: "contain",
            padding: title ? "0 16px 16px" : "0 16px 16px",
            paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
