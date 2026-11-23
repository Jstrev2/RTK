import credits from "@/lib/photo-credits.json";

/**
 * Running photography in public/photos (Wikimedia Commons, licenses that
 * allow commercial use; credited on /credits). Pages and guides pick from
 * these by topic so every page has a real photo.
 */

export type Photo = { src: string; alt: string; author: string; license: string; source: string };

const ALT: Record<string, string> = {
  "marathon-overhead": "Marathon runners filling a city street, seen from above",
  "marathon-street": "Runners on a tree-lined marathon course",
  "marathon-pack": "A dense pack of marathon runners",
  "elite-stride": "An elite runner mid-stride on a city road",
  "elite-stride-2": "An elite runner pushing the pace",
  "finish-joy": "A runner celebrating after the finish",
  "finish-thumbs": "A runner giving a thumbs up with a medal",
  "medal-bite": "A finisher biting his medal",
  "trail-ridge": "A trail runner on a grassy ridge",
  "mountain-run": "A runner climbing a mountain ridge",
  "finish-arch": "A runner crossing a finish arch with the race clock",
  "finish-clock": "A runner approaching the finish clock",
  "city-race": "Runners racing through a city street",
  "medal-smile": "A smiling finisher with her medal",
  "marathon-road": "Marathon runners spread across a sunny road"
};

const ALL: Photo[] = (credits as { file: string; author: string; license: string; source: string }[]).map((c) => {
  const key = c.file.replace(/^\/photos\//, "").replace(/\.webp$/, "");
  return { src: c.file, alt: ALT[key] ?? "Runners in a race", author: c.author, license: c.license, source: c.source };
});

const byKey = (key: string) => ALL.find((p) => p.src === `/photos/${key}.webp`) ?? ALL[0];

export const PHOTOS = {
  home: () => byKey("marathon-overhead"),
  shoes: () => byKey("elite-stride"),
  music: () => byKey("finish-joy"),
  fuel: () => byKey("trail-ridge"),
  guides: () => byKey("finish-arch"),
  byKey
};

const TOPIC: Record<string, string[]> = {
  shoes: ["elite-stride", "elite-stride-2", "marathon-road", "city-race"],
  gear: ["elite-stride-2", "city-race"],
  music: ["finish-joy", "finish-thumbs", "medal-smile"],
  fueling: ["trail-ridge", "mountain-run", "marathon-street"],
  nutrition: ["mountain-run", "trail-ridge"],
  "race-day": ["finish-arch", "finish-clock", "medal-bite", "marathon-pack"],
  training: ["marathon-street", "city-race", "marathon-road"],
  beginners: ["medal-smile", "finish-thumbs", "marathon-street"]
};

/** A stable photo for a guide: by its first known tag, varied by slug. */
export function photoForGuide(tags: string[], slug: string): Photo {
  const tag = tags.map((t) => t.toLowerCase()).find((t) => TOPIC[t]);
  const pool = (tag ? TOPIC[tag] : Object.keys(ALT)).map(byKey);
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
}

export function allPhotos() {
  return ALL;
}
