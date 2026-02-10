import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app/", "/api/", "/reset"],
      },
    ],
    sitemap: "https://routines365.com/sitemap.xml",
  };
}
