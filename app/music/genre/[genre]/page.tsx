import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import SongPage from "../../_components/song-page";
import { getGenrePage } from "@/lib/content/music";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 86400;
export const dynamicParams = true;

// Pages render on first request and are then cached for a day.
export async function generateStaticParams(): Promise<{ genre: string }[]> {
  return [];
}

type Props = { params: Promise<{ genre: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getGenrePage((await params).genre);
  if (!page) return { title: "Page Not Found", robots: { index: false, follow: true } };
  return pageMetadata({ title: page.metaTitle, description: page.metaDescription, path: page.path });
}

export default async function Page({ params }: Props) {
  const { genre } = await params;
  const page = await getGenrePage(genre);
  // Genres that were folded into another, or have too few songs now.
  if (!page) permanentRedirect(genre === "funk" ? "/music/genre/soul" : "/music");
  return <SongPage page={page} />;
}
