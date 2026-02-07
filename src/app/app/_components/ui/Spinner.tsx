"use client";

/**
 * Tiny inline spinner for button loading states.
 * Replaces bare "Working…" text with visual feedback.
 */
export function Spinner({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-block rounded-full animate-spin ${className}`}
      style={{
        width: size,
        height: size,
        border: "2px solid currentColor",
        borderTopColor: "transparent",
        opacity: 0.7,
      }}
      aria-hidden="true"
    />
  );
}
