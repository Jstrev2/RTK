import type { Metadata } from "next";

export const SITE_URL = "https://runnertoolkit.com";
export const SITE_NAME = "Runner Toolkit";
export const OG_IMAGE = "/og.jpg";

/**
 * Standard metadata for a static page: title (run through the root template),
 * description, self-referencing canonical, and complete OpenGraph/Twitter
 * blocks. Next.js replaces inherited openGraph/twitter objects wholesale, so
 * every page that overrides anything must ship the full object.
 */
export function pageMetadata({
  title,
  description,
  path,
  image = OG_IMAGE
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const ogImages =
    image === OG_IMAGE
      ? [{ url: image, width: 1200, height: 630, alt: title }]
      : [{ url: image, alt: title }];

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
      images: ogImages
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
    }
  };
}
