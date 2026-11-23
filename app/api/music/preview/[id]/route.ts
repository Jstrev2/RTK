import { NextResponse } from "next/server";

/*
 * Deezer's preview links expire after about fifteen minutes, so the finder
 * asks here for a fresh one and is sent straight to the MP3.
 */
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{1,12}$/.test(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const response = await fetch(`https://api.deezer.com/track/${id}`, { cache: "no-store" });
  const track = (await response.json().catch(() => null)) as { preview?: string } | null;
  if (!track?.preview) return NextResponse.json({ error: "No preview" }, { status: 404 });
  return NextResponse.redirect(track.preview, {
    status: 302,
    headers: { "Cache-Control": "public, s-maxage=300, max-age=300" }
  });
}
