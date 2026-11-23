import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MusicContent from "../../_components/music-content";
import { getBpmPage } from "@/lib/content/music-pages";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 86400;
export const dynamicParams = true;

// Pages render on first request and are then cached for the revalidate window.
export async function generateStaticParams(): Promise<{ bpm: string }[]> {
  return [];
}

type Props = { params: Promise<{ bpm: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const page = await getBpmPage(p.bpm);
  if (!page) return { title: "Page Not Found", robots: { index: false, follow: true } };
  return pageMetadata({ title: page.metaTitle, description: page.metaDescription, path: page.path });
}

export default async function Page({ params }: Props) {
  const p = await params;
  const page = await getBpmPage(p.bpm);
  if (!page) notFound();
  return <MusicContent page={page} />;
}
