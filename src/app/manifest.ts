import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Routines365 — Daily Habit Tracker",
    short_name: "Routines365",
    description: "Build daily habits that stick. Track streaks, journal with guided prompts, practice breathwork, and watch consistency compound.",
    start_url: "/app/today",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      {
        src: "/brand/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
