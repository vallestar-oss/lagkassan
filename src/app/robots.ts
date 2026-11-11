import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lagkassan.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /p/<slug> is deliberately NOT listed: it carries a noindex tag, and a
      // robots.txt block would stop crawlers from ever seeing that tag.
      disallow: ["/dashboard", "/collections", "/teams", "/auth/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
