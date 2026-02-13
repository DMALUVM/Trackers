"use client";

import type { ReactNode, CSSProperties } from "react";

/**
 * Reliable external link for Capacitor WKWebView.
 *
 * <a target="_blank"> is unreliable in WKWebView — sometimes it works,
 * sometimes it silently fails. This component uses an onClick handler
 * with window.open() triggered from the user gesture, which is
 * consistently handled by the webview.
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
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        window.open(href, "_blank", "noopener,noreferrer");
      }}
      className={className}
      style={style}
    >
      {children}
    </a>
  );
}
