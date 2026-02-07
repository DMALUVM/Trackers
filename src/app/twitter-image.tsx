import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "routines365 — Stack your days. Change your life.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TwitterImage() {
  const logoData = await readFile(join(process.cwd(), "public/brand/routines365-logo.png"));
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

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
          fontFamily: "system-ui, sans-serif",
          gap: 60,
          padding: "0 80px",
        }}
      >
        <img
          src={logoBase64}
          width={280}
          height={280}
          style={{ borderRadius: 48, boxShadow: "0 0 80px rgba(16,185,129,0.15)" }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 600 }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            routines365
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: "#10b981", marginTop: 4, lineHeight: 1.3 }}>
            Stack your days. Change your life.
          </div>
          <div style={{ fontSize: 18, color: "#a3a3a3", marginTop: 12, lineHeight: 1.5 }}>
            The daily habit tracker that keeps it simple. Build streaks, hit milestones, and watch consistency compound.
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 20 }}>
            {[
              { emoji: "⚡", label: "One-tap tracking" },
              { emoji: "🟢", label: "Green days" },
              { emoji: "🔥", label: "Streaks" },
            ].map(({ emoji, label }) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.08)", borderRadius: 20,
                padding: "8px 16px", fontSize: 15, color: "#d4d4d4",
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
