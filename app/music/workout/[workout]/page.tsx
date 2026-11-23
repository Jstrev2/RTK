import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import SongPage from "../../_components/song-page";
import { getWorkoutPage } from "@/lib/content/music";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 86400;
export const dynamicParams = true;

// Pages render on first request and are then cached for a day.
export async function generateStaticParams(): Promise<{ workout: string }[]> {
  return [];
}

type Props = { params: Promise<{ workout: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getWorkoutPage((await params).workout);
  if (!page) return { title: "Page Not Found", robots: { index: false, follow: true } };
  return pageMetadata({ title: page.metaTitle, description: page.metaDescription, path: page.path });
}

export default async function Page({ params }: Props) {
  const page = await getWorkoutPage((await params).workout);
  // Pages that no longer have enough songs (or never existed) send readers to the hub.
  if (!page) permanentRedirect("/music");
  return <SongPage page={page} />;
}
