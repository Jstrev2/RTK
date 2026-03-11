import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { CatalogAlias } from "@/lib/ingest/catalog-aliases";

function generateAliasesForShoe(name: string, brand: string): string[] {
  const lowerName = name.toLowerCase();
  const lowerBrand = brand.toLowerCase();

  // Strip brand prefix from name to get model (e.g., "ASICS Superblast 3" → "superblast 3")
  const model = lowerName.startsWith(lowerBrand)
    ? lowerName.slice(lowerBrand.length).trim()
    : lowerName;

  const aliases = new Set<string>();

  // Full name: "asics superblast 3"
  aliases.add(lowerName);

  // Model only: "superblast 3"
  if (model && model !== lowerName) {
    aliases.add(model);
  }

  // Collapsed number variant: "superblast3"
  const collapsed = model.replace(/\s+(\d+)$/, "$1");
  if (collapsed !== model) {
    aliases.add(collapsed);
  }

  // Handle multi-word brands like "New Balance" — add variant without space
  // e.g., "new balance fresh foam x 1080 v14" also match "nb fresh foam..."
  // But keep it simple — the main aliases above cover most cases

  return Array.from(aliases);
}

export async function generateShoeAliases(): Promise<CatalogAlias[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("shoe_models")
    .select("item_key, name, brand, release_year")
    .eq("is_active", true);

  if (error || !data) {
    console.error("[generate-aliases] Failed to fetch shoe_models:", error?.message);
    return [];
  }

  return data.map((shoe: { item_key: string; name: string; brand: string; release_year: number | null }) => ({
    itemType: "shoe" as const,
    itemKey: shoe.item_key,
    name: shoe.name,
    brand: shoe.brand,
    releaseYear: shoe.release_year?.toString(),
    aliases: generateAliasesForShoe(shoe.name, shoe.brand),
  }));
}
