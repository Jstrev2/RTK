import { normalizeText } from "@/lib/ingest/text";

export type ShoeCandidate = {
  itemKey: string;
  name: string;
  brand: string;
  mentionCount: number;
  mentionScore: number;
  lastSeen?: string;
  lastTitle?: string;
  lastUrl?: string;
};

type RedditPost = {
  title: string;
  body: string;
  score: number;
  createdUtc: number;
  permalink: string;
};

const BRANDS = [
  "nike", "asics", "brooks", "hoka", "adidas", "new balance",
  "saucony", "on running", "on cloud", "puma", "mizuno", "altra",
  "salomon", "skechers", "reebok", "merrell", "inov-8", "inov8",
  "topo", "craft", "karhu", "diadora",
];

// Build a regex that finds "brand" followed by a model name (1-4 words, starting with uppercase or containing numbers)
// Examples: "ASICS Superblast 3", "Nike Pegasus Premium", "Brooks Ghost Max 2", "New Balance SC Elite v4"
const BRAND_PATTERN = BRANDS.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
const SHOE_REGEX = new RegExp(
  `\\b(${BRAND_PATTERN})\\s+((?:[a-z]+\\s*){1,4}\\d{0,2}(?:\\s*v\\d+)?)\\b`,
  "gi"
);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanModelName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    // Remove trailing noise words that aren't part of shoe names
    .replace(/\b(is|are|was|were|the|and|for|with|my|your|this|that|just|got|have|had|has|been|its|it)\s*$/i, "")
    .trim();
}

function normalizeBrand(raw: string): string {
  const lower = raw.toLowerCase();
  const brandMap: Record<string, string> = {
    "on running": "On",
    "on cloud": "On",
    "inov-8": "Inov-8",
    "inov8": "Inov-8",
    "new balance": "New Balance",
    "nike": "Nike",
    "asics": "ASICS",
    "brooks": "Brooks",
    "hoka": "Hoka",
    "adidas": "Adidas",
    "saucony": "Saucony",
    "puma": "Puma",
    "mizuno": "Mizuno",
    "altra": "Altra",
    "salomon": "Salomon",
    "skechers": "Skechers",
    "reebok": "Reebok",
    "merrell": "Merrell",
    "topo": "Topo",
    "craft": "Craft",
    "karhu": "Karhu",
    "diadora": "Diadora",
  };
  return brandMap[lower] ?? raw;
}

// Words that, when they ARE the entire model name, indicate a false positive
const NOISE_MODELS = new Set([
  "shoes", "shoe", "running", "run", "runner", "sneakers",
  "sale", "review", "reviews", "vs", "question", "help",
  "size", "sizing", "fit", "wide", "narrow",
  "deal", "deals", "discount", "code",
  "new", "old", "best", "worst", "good", "bad",
  "men", "mens", "women", "womens", "unisex",
]);

const scoreWeight = (score: number) => {
  const normalized = Math.max(0, Math.min(score, 2000));
  return 1 + Math.log(1 + normalized / 10);
};

/**
 * Scan Reddit posts for shoe names that don't exist in the known catalog.
 * Uses brand names as anchors to find "Brand ModelName Number" patterns.
 */
export function discoverNewShoes(
  posts: RedditPost[],
  knownItemKeys: Set<string>
): ShoeCandidate[] {
  const candidates = new Map<string, ShoeCandidate>();

  for (const post of posts) {
    const text = `${post.title} ${post.body}`;
    let match: RegExpExecArray | null;

    // Reset regex state
    SHOE_REGEX.lastIndex = 0;

    while ((match = SHOE_REGEX.exec(text)) !== null) {
      const rawBrand = match[1];
      const rawModel = cleanModelName(match[2]);

      if (!rawModel || rawModel.length < 3) continue;

      // Filter out noise
      const normalizedModel = normalizeText(rawModel);
      if (NOISE_MODELS.has(normalizedModel)) continue;
      // Skip if model is just a single common word under 5 chars
      if (!normalizedModel.includes(" ") && normalizedModel.length < 5 && !/\d/.test(normalizedModel)) continue;

      const brand = normalizeBrand(rawBrand);
      const name = `${brand} ${rawModel.charAt(0).toUpperCase() + rawModel.slice(1)}`;
      const itemKey = slugify(name);

      // Skip shoes already in the catalog
      if (knownItemKeys.has(itemKey)) continue;

      const existing = candidates.get(itemKey);
      if (existing) {
        existing.mentionCount += 1;
        existing.mentionScore += scoreWeight(post.score);
        const postTime = new Date(post.createdUtc * 1000).toISOString();
        if (!existing.lastSeen || postTime > existing.lastSeen) {
          existing.lastSeen = postTime;
          existing.lastTitle = post.title;
          existing.lastUrl = post.permalink;
        }
      } else {
        candidates.set(itemKey, {
          itemKey,
          name,
          brand,
          mentionCount: 1,
          mentionScore: scoreWeight(post.score),
          lastSeen: new Date(post.createdUtc * 1000).toISOString(),
          lastTitle: post.title,
          lastUrl: post.permalink,
        });
      }
    }
  }

  // Filter: require at least 2 mentions to reduce noise
  return Array.from(candidates.values())
    .filter((c) => c.mentionCount >= 2)
    .sort((a, b) => b.mentionScore - a.mentionScore);
}
