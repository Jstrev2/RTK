import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type SearchHit = {
  kind: "shoe" | "song" | "fuel" | "guide";
  title: string;
  sub: string;
  href: string;
  image: string | null;
};

export type SearchResults = Record<SearchHit["kind"], SearchHit[]>;

const EMPTY: SearchResults = { shoe: [], song: [], fuel: [], guide: [] };

/** Turns "nike  peg 41" into an ilike pattern per word, so word order doesn't matter. */
function terms(q: string) {
  return q
    .toLowerCase()
    .replace(/[%_,()]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .slice(0, 5);
}

export async function searchSite(q: string, limit = 6): Promise<SearchResults> {
  const words = terms(q);
  const supabase = getSupabaseAdmin();
  if (!words.length || !supabase) return EMPTY;

  // Every word must appear in the name, the brand or the artist.
  const shoeQ = supabase.from("shoe_models").select("item_key,name,brand,price,image_url,popularity").eq("is_active", true);
  const songQ = supabase.from("music_songs").select("id,title,artist,bpm,image_url,spotify_id,popularity").not("bpm", "is", null);
  const fuelQ = supabase.from("fuel_gels").select("item_key,name,brand,carbs_g,image_url").eq("is_active", true).gt("carbs_g", 0);
  const guideQ = supabase.from("articles").select("slug,title,excerpt,tags").eq("is_published", true);

  let s = shoeQ, m = songQ, f = fuelQ, g = guideQ;
  for (const w of words) {
    s = s.or(`name.ilike.%${w}%,brand.ilike.%${w}%`);
    m = m.or(`title.ilike.%${w}%,artist.ilike.%${w}%`);
    f = f.or(`name.ilike.%${w}%,brand.ilike.%${w}%`);
    g = g.or(`title.ilike.%${w}%,excerpt.ilike.%${w}%`);
  }

  const [shoes, songs, fuel, guides] = await Promise.all([
    s.order("popularity", { ascending: false }).limit(limit),
    m.order("popularity", { ascending: false, nullsFirst: false }).limit(limit),
    f.order("brand").limit(limit),
    g.order("published_at", { ascending: false }).limit(limit)
  ]);

  type Row = Record<string, unknown>;
  const rows = (r: { data: unknown }) => ((r.data as Row[] | null) ?? []);

  return {
    shoe: rows(shoes).map((r) => ({
      kind: "shoe",
      title: String(r.name),
      sub: r.price ? `$${r.price}` : String(r.brand ?? ""),
      href: `/shoes/${r.item_key}`,
      image: (r.image_url as string) ?? null
    })),
    song: rows(songs).map((r) => ({
      kind: "song",
      title: String(r.title),
      sub: `${r.artist} · ${r.bpm} BPM`,
      href: r.spotify_id ? `https://open.spotify.com/track/${r.spotify_id}` : `/tools/music?q=${encodeURIComponent(String(r.title))}`,
      image: (r.image_url as string) ?? null
    })),
    fuel: rows(fuel).map((r) => ({
      kind: "fuel",
      title: String(r.name),
      sub: `${r.brand} · ${r.carbs_g}g carbs`,
      href: `/fuel/gels/${r.item_key}`,
      image: (r.image_url as string) ?? null
    })),
    guide: rows(guides).map((r) => ({
      kind: "guide",
      title: String(r.title),
      sub: (r.tags as string[] | null)?.slice(0, 2).join(" · ") ?? "Guide",
      href: `/rundown/${r.slug}`,
      image: null
    }))
  };
}
