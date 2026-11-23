import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import SongPage from "../../_components/song-page";
import { getPacePage, paceAlias } from "@/lib/content/music";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ pace: string }[]> {
  return [];
}

type Props = { params: Promise<{ pace: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPacePage((await params).pace);
  if (!page) return { title: "Page Not Found", robots: { index: false, follow: true } };
  return pageMetadata({ title: page.metaTitle, description: page.metaDescription, path: page.path });
}

export default async function Page({ params }: Props) {
  const { pace } = await params;
  // Paces with the same step rate as a published one send readers there.
  const alias = paceAlias(pace);
  if (alias) permanentRedirect(`/music/pace/${alias}`);
  const page = await getPacePage(pace);
  if (!page) permanentRedirect("/music");
  return <SongPage page={page} />;
}
