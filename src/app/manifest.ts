import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cineverse",
    short_name: "Cineverse",
    description:
      "Explore movies from around the world as buildings in a 3D pixel art city. Filter by genre, language, and country.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d1117",
    theme_color: "#4ADE80",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
