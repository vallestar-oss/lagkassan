import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lagkassan.vercel.app";

// Only the public marketing/legal pages — never /p/<slug> payment links.
const paths = ["/", "/guide", "/login", "/signup", "/villkor", "/integritetspolicy"];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({
    url: `${baseUrl}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" ? "monthly" : "yearly",
  }));
}
