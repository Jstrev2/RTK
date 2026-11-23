import { NextResponse } from "next/server";
import { searchSite } from "@/lib/search";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 80);
  if (q.trim().length < 2) return NextResponse.json({ shoe: [], song: [], fuel: [], guide: [] });
  const results = await searchSite(q, 5).catch(() => ({ shoe: [], song: [], fuel: [], guide: [] }));
  return NextResponse.json(results, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
