import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Homem & Mulher — Perfumaria Artesanal",
    short_name: "Homem & Mulher",
    start_url: "/pt",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#141210",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
