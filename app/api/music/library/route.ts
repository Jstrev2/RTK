import { NextResponse } from "next/server";
import { readLibrary } from "@/lib/music/library";

/** The whole playable library in compact form, for the Music Finder. Rebuilt hourly. */
export const revalidate = 3600;

export async function GET() {
  try {
    const songs = await readLibrary();
    return NextResponse.json(
      { songs, updated: new Date().toISOString() },
      { headers: { "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch (error) {
    return NextResponse.json({ songs: [], error: (error as Error).message }, { status: 500 });
  }
}
