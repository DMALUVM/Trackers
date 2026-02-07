"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { hapticMedium } from "@/lib/haptics";

/**
 * Pull-to-refresh for PWA — the #1 missing native gesture.
 *
 * Psychology: Immediate feedback loop. When data feels stale,
 * users pull down instinctively. Without it, they reload the page
 * (which in a PWA means re-bootstrapping the entire shell).
 *
 * Implementation: Touch-based with rubber-band physics, threshold
 * detection, and spinner indicator. Only activates when scrolled
 * to top (scrollY ≈ 0) so it doesn't interfere with normal scrolling.
 */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const pulling$ = useRef(false);

  const THRESHOLD = 80;
  const MAX_PULL = 130;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only activate if at the very top of the page
    if (window.scrollY > 5) return;
    touchStartY.current = e.touches[0].clientY;
    pulling$.current = false;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (refreshing) return;
    if (window.scrollY > 5) return;

    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy < 0) return; // Scrolling up, not pulling

    // Rubber-band: diminishing returns past threshold
    const distance = dy < THRESHOLD ? dy : THRESHOLD + (dy - THRESHOLD) * 0.3;
    const clamped = Math.min(distance, MAX_PULL);

    if (clamped > 10 && !pulling$.current) {
      pulling$.current = true;
      setPulling(true);
    }

    if (pulling$.current) {
      setPullDistance(clamped);
      // Prevent default scroll when we're pulling
      if (clamped > 10) e.preventDefault();
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling$.current) return;

    if (pullDistance >= THRESHOLD) {
      hapticMedium();
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.6); // Snap to loading position
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
        setPulling(false);
        pulling$.current = false;
      }
    } else {
      setPullDistance(0);
      setPulling(false);
      pulling$.current = false;
    }
  }, [pullDistance, onRefresh]);

  useEffect(() => {
    const opts: AddEventListenerOptions = { passive: false };
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, opts);
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(1, pullDistance / THRESHOLD);
  const pastThreshold = pullDistance >= THRESHOLD;

  return { pulling, refreshing, pullDistance, progress, pastThreshold };
}
