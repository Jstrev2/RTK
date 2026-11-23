import { permanentRedirect } from "next/navigation";

/* Genre-by-BPM-range pages were folded into the genre page, which filters by stride. */
type Props = { params: Promise<{ genre: string; range: string }> };

export default async function Page({ params }: Props) {
  const { genre } = await params;
  permanentRedirect(`/music/genre/${genre}`);
}
