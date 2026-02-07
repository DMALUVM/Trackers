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
          background: "linear-gradient(135deg, #0f172a 0%, #020617 40%, #000000 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          gap: 50,
          padding: "40px 60px",
        }}
      >
        <img
          src={logoBase64}
          width={340}
          height={340}
          style={{ borderRadius: 56, flexShrink: 0 }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          <div style={{
            fontSize: 58, fontWeight: 900,
            color: "#ffffff", letterSpacing: "-0.04em", lineHeight: 1.0,
          }}>
            routines365
          </div>
          <div style={{
            fontSize: 26, fontWeight: 700, color: "#34d399",
            marginTop: 8, lineHeight: 1.2,
          }}>
            Stack your days. Change your life.
          </div>
          <div style={{ fontSize: 17, color: "#94a3b8", marginTop: 14, lineHeight: 1.5 }}>
            The daily habit tracker that keeps it simple. Build streaks, hit milestones, and watch consistency compound.
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
            {[
              { emoji: "⚡", label: "One-tap" },
              { emoji: "🟢", label: "Green days" },
              { emoji: "🔥", label: "Streaks" },
              { emoji: "🏆", label: "Trophies" },
            ].map(({ emoji, label }) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)",
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
