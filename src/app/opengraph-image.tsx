import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Routines365 — Stack your days. Change your life.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BAR_COLORS = ["#bef264", "#86efac", "#4ade80", "#34d399", "#10b981", "#059669"];

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#000000",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          gap: 56,
          padding: "40px 70px",
        }}
      >
        {/* Brand icon — 7-bar stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
          {/* Empty outlined bar */}
          <div style={{
            width: 140, height: 28, borderRadius: 8,
            border: "3px solid rgba(255,255,255,0.8)",
          }} />
          {/* 6 filled bars */}
          {BAR_COLORS.map((color) => (
            <div key={color} style={{
              width: 140, height: 28, borderRadius: 8,
              background: color,
            }} />
          ))}
        </div>

        {/* Text side */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          <div style={{
            fontSize: 56, fontWeight: 600,
            color: "#ffffff", letterSpacing: "0.06em", lineHeight: 1.0,
            textTransform: "uppercase" as const,
          }}>
            ROUTINES365
          </div>
          <div style={{
            fontSize: 26, fontWeight: 600, color: "#34d399",
            marginTop: 10, lineHeight: 1.2,
          }}>
            Stack your days. Change your life.
          </div>
          <div style={{ fontSize: 17, color: "#94a3b8", marginTop: 14, lineHeight: 1.5 }}>
            The daily habit tracker that keeps it simple. Build streaks, hit milestones, and watch consistency compound.
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            {[
              { emoji: "⚡", label: "One-tap" },
              { emoji: "🟢", label: "Green days" },
              { emoji: "🔥", label: "Streaks" },
              { emoji: "🏆", label: "Trophies" },
            ].map(({ emoji, label }) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20, padding: "7px 14px", fontSize: 14, color: "#e2e8f0",
              }}>
                <span>{emoji}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
