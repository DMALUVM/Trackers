import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "routines365 — Stack your days. Change your life.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #111111 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle green glow behind logo */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -60%)",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Logo placeholder circle */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 28,
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 56,
            marginBottom: 32,
            boxShadow: "0 0 60px rgba(16,185,129,0.2)",
          }}
        >
          ✓
        </div>

        {/* App name */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            marginBottom: 12,
          }}
        >
          routines365
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            fontWeight: 500,
            color: "#10b981",
            marginBottom: 24,
          }}
        >
          Stack your days. Change your life.
        </div>

        {/* Value props */}
        <div
          style={{
            display: "flex",
            gap: 32,
            fontSize: 18,
            color: "#a3a3a3",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>⚡</span>
            <span>One-tap tracking</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>🟢</span>
            <span>Green days</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>🔥</span>
            <span>Streaks</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
