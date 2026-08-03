import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /account and /login are excluded via noindex meta in their layouts;
      // they must stay crawlable so robots can actually see that directive.
      disallow: ["/api/"],
    },
    sitemap: "https://runnertoolkit.com/sitemap.xml",
  };
}
