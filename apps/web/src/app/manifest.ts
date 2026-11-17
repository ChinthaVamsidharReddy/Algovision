import type { MetadataRoute } from "next";
import { brand } from "../../brand.config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${brand.name} - ${brand.tagline}`,
    short_name: brand.name,
    description: brand.description,
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#f6f7fb",
    theme_color: "#3445d6",
    categories: ["education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Review today", url: "/review" },
      { name: "Algorithms", url: "/algorithms" },
      { name: "Practice", url: "/practice" },
    ],
  };
}
