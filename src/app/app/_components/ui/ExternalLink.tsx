"use client";

import { useCallback, type ReactNode, type CSSProperties, type MouseEvent } from "react";

/**
 * Reliable external link for Capacitor WKWebView.
 *
 * Neither target="_blank" nor window.open() work consistently in
 * Capacitor's WKWebView. The reliable method is to create a fresh
 * <a> element and programmatically click it — this triggers
 * WKWebView's decidePolicyForNavigationAction delegate, which
 * Capacitor configures to open external URLs in Safari.
 */
export function ExternalLink({
  href,
  children,
  className,
  style,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const handleClick = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Create a fresh anchor and click it — this goes through
    // WKWebView's navigation delegate reliably every time
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.position = "fixed";
    a.style.top = "-9999px";
    a.style.left = "-9999px";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try { document.body.removeChild(a); } catch { /* already removed */ }
    }, 200);
  }, [href]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
      style={style}
    >
      {children}
    </a>
  );
}
