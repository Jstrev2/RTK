export type CatalogAlias = {
  itemType: "shoe" | "attire";
  itemKey: string;
  name: string;
  brand?: string;
  category?: string;
  releaseYear?: string;
  aliases: string[];
};

// Fallback aliases used when Supabase is unavailable.
// Dynamic aliases are generated at runtime from shoe_models table
// via generate-aliases.ts — these are only used as a safety net.
export const FALLBACK_SHOE_ALIASES: CatalogAlias[] = [
  {
    itemType: "shoe",
    itemKey: "nike-alphafly-3",
    name: "Nike Alphafly 3",
    brand: "Nike",
    releaseYear: "2024",
    aliases: ["alphafly 3", "nike alphafly 3", "af3", "alphafly3"]
  },
  {
    itemType: "shoe",
    itemKey: "nike-vaporfly-3",
    name: "Nike Vaporfly 3",
    brand: "Nike",
    releaseYear: "2023",
    aliases: ["vaporfly 3", "nike vaporfly 3", "vf3", "vaporfly3"]
  },
  {
    itemType: "shoe",
    itemKey: "brooks-glycerin-max",
    name: "Brooks Glycerin Max",
    brand: "Brooks",
    releaseYear: "2024",
    aliases: ["glycerin max", "brooks glycerin max", "glycerinmax"]
  },
  {
    itemType: "shoe",
    itemKey: "asics-novablast-5",
    name: "ASICS Novablast 5",
    brand: "ASICS",
    releaseYear: "2025",
    aliases: ["novablast 5", "asics novablast 5", "nb5", "novablast5"]
  },
  {
    itemType: "shoe",
    itemKey: "adidas-evo-sl",
    name: "Adidas Evo SL",
    brand: "Adidas",
    releaseYear: "2025",
    aliases: ["evo sl", "adidas evo sl", "adizero evo sl"]
  },
  {
    itemType: "shoe",
    itemKey: "asics-superblast-2",
    name: "ASICS Superblast 2",
    brand: "ASICS",
    releaseYear: "2024",
    aliases: ["superblast 2", "asics superblast 2", "superblast2"]
  },
  {
    itemType: "shoe",
    itemKey: "hoka-skyward-x",
    name: "Hoka Skyward X",
    brand: "Hoka",
    releaseYear: "2024",
    aliases: ["skyward x", "hoka skyward x", "skywardx"]
  },
  {
    itemType: "shoe",
    itemKey: "brooks-ghost-16",
    name: "Brooks Ghost 16",
    brand: "Brooks",
    releaseYear: "2024",
    aliases: ["ghost 16", "brooks ghost 16", "ghost16"]
  },
  {
    itemType: "shoe",
    itemKey: "nike-pegasus-41",
    name: "Nike Pegasus 41",
    brand: "Nike",
    releaseYear: "2024",
    aliases: ["pegasus 41", "nike pegasus 41", "peg 41", "pegasus41"]
  },
  {
    itemType: "shoe",
    itemKey: "saucony-endorphin-speed-4",
    name: "Saucony Endorphin Speed 4",
    brand: "Saucony",
    releaseYear: "2024",
    aliases: ["endorphin speed 4", "speed 4", "saucony speed 4", "es4"]
  },
  {
    itemType: "attire",
    itemKey: "tracksmith",
    name: "Tracksmith",
    brand: "Tracksmith",
    category: "apparel",
    aliases: ["tracksmith", "van cortlandt", "eliot runner"]
  },
  {
    itemType: "attire",
    itemKey: "lululemon",
    name: "Lululemon",
    brand: "Lululemon",
    category: "apparel",
    aliases: ["lululemon", "fast and free", "hotty hot"]
  },
  {
    itemType: "attire",
    itemKey: "rabbit",
    name: "Rabbit",
    brand: "Rabbit",
    category: "apparel",
    aliases: ["rabbit", "rabbit running"]
  },
  {
    itemType: "attire",
    itemKey: "janji",
    name: "Janji",
    brand: "Janji",
    category: "apparel",
    aliases: ["janji", "rainrunner"]
  },
  {
    itemType: "attire",
    itemKey: "ciele",
    name: "Ciele Athletics",
    brand: "Ciele",
    category: "accessories",
    aliases: ["ciele", "gocap"]
  },
  {
    itemType: "attire",
    itemKey: "oiselle",
    name: "Oiselle",
    brand: "Oiselle",
    category: "apparel",
    aliases: ["oiselle"]
  },
  {
    itemType: "attire",
    itemKey: "saysky",
    name: "Saysky",
    brand: "Saysky",
    category: "apparel",
    aliases: ["saysky"]
  },
  {
    itemType: "attire",
    itemKey: "vuori",
    name: "Vuori",
    brand: "Vuori",
    category: "apparel",
    aliases: ["vuori"]
  },
  {
    itemType: "attire",
    itemKey: "patagonia",
    name: "Patagonia",
    brand: "Patagonia",
    category: "apparel",
    aliases: ["patagonia", "capilene"]
  },
  {
    itemType: "attire",
    itemKey: "smartwool",
    name: "Smartwool",
    brand: "Smartwool",
    category: "apparel",
    aliases: ["smartwool", "merino base layer"]
  }
];

export const catalogAliases = FALLBACK_SHOE_ALIASES;
export const shoeAliases = FALLBACK_SHOE_ALIASES.filter((item) => item.itemType === "shoe");
export const attireAliases = FALLBACK_SHOE_ALIASES.filter((item) => item.itemType === "attire");
