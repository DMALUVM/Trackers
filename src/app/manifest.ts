import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "routines365",
    short_name: "routines365",
    description: "A daily routines tracker with cloud sync and beautiful progress.",
    start_url: "/app/routines",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/brand/routines365-logo.png",
        sizes: "1024x1024",
        type: "image/png",
      },
    ],
  };
}
