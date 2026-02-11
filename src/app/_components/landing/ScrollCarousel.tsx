"use client";

import { useRef, useState, useEffect, useCallback } from "react";

export function ScrollCarousel({
  children,
  className = "",
  itemCount = 5,
  itemWidth = 240,
}: {
  children: React.ReactNode;
  className?: string;
  itemCount?: number;
  itemWidth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollStep = itemWidth + 24; // item + gap

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);

    // Calculate which item is centered
    const idx = Math.round(el.scrollLeft / scrollStep);
    setActiveIndex(Math.min(idx, itemCount - 1));
  }, [itemCount, scrollStep]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [check]);

  const scroll = (dir: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -scrollStep : scrollStep, behavior: "smooth" });
  };

  const scrollTo = (index: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: index * scrollStep, behavior: "smooth" });
  };

  return (
    <div className="relative group">
      <div
        ref={ref}
        className={`flex gap-6 overflow-x-auto pb-4 px-2 snap-x snap-mandatory no-scrollbar ${className}`}
      >
        {children}
      </div>

      {/* Scroll dots — always visible */}
      <div className="flex justify-center items-center gap-2 mt-4">
        {Array.from({ length: itemCount }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={`Go to screen ${i + 1}`}
            className="transition-all duration-300"
            style={{
              width: activeIndex === i ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: activeIndex === i ? "#10b981" : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </div>

      {/* Left arrow — desktop only */}
      {canLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="hidden lg:flex absolute left-0 top-[calc(50%-20px)] -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full items-center justify-center transition-all opacity-0 group-hover:opacity-100"
          style={{
            background: "rgba(0,0,0,0.8)",
            border: "1px solid rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
          }}
          aria-label="Scroll left"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* Right arrow — desktop only */}
      {canRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="hidden lg:flex absolute right-0 top-[calc(50%-20px)] -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full items-center justify-center transition-all opacity-0 group-hover:opacity-100"
          style={{
            background: "rgba(0,0,0,0.8)",
            border: "1px solid rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
          }}
          aria-label="Scroll right"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}
