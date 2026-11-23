import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import SongPage from "../../_components/song-page";
import { getBpmPage, getMusicIndex } from "@/lib/content/music";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 86400;
export const dynamicParams = true;

// Pages render on first request and are then cached for a day.
export async function generateStaticParams(): Promise<{ bpm: string }[]> {
  return [];
}

type Props = { params: Promise<{ bpm: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getBpmPage((await params).bpm);
  if (!page) return { title: "Page Not Found", robots: { index: false, follow: true } };
  return pageMetadata({ title: page.metaTitle, description: page.metaDescription, path: page.path });
}

export default async function Page({ params }: Props) {
  const { bpm } = await params;
  const page = await getBpmPage(bpm);
  if (!page) {
    // The nearest BPM that has a page, or the hub.
    const target = Number(bpm);
    const { bpms } = await getMusicIndex();
    const nearest = Number.isFinite(target) ? [...bpms].sort((a, b) => Math.abs(a.bpm - target) - Math.abs(b.bpm - target))[0] : null;
    permanentRedirect(nearest && Math.abs(nearest.bpm - target) <= 10 ? `/music/bpm/${nearest.bpm}` : "/music");
  }
  return <SongPage page={page} />;
}
