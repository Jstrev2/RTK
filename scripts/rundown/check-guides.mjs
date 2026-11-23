/**
 * Check every guide in content/rundown/*.md and (with --write) bundle them
 * into content/guides.json, which the live site syncs from.
 *
 *   node scripts/rundown/check-guides.mjs            check only
 *   node scripts/rundown/check-guides.mjs --write    check, then write the bundle
 *   node scripts/rundown/check-guides.mjs --pr       also check the branch's diff
 *                                                    against origin/main (the
 *                                                    routine's merge gate)
 *
 * No npm install needed: Node built-ins only. Exit code 1 on any failure.
 * The rules are CONTENT_VOICE.md made mechanical. Never loosen them to get a
 * guide through; fix the guide.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const GUIDE_DIR = path.join(ROOT, "content", "rundown");
const BUNDLE = path.join(ROOT, "content", "guides.json");
const SITE = "https://runnertoolkit.com";

const TAGS = new Set(["shoes", "gear", "music", "fueling", "training", "race-day", "beginners", "nutrition"]);
const MAX_NEW_PER_PR = 8;
// Guides written by hand before the routine existed. They are bundled and
// synced but held only to the frontmatter rules; everything new gets them all.
const LEGACY = new Set([
  "spring-2026-shoe-releases", "race-day-fueling-mistakes", "how-to-choose-your-first-racing-shoe",
  "la-marathon-2026-unlikely-winners", "shoe-rotation-two-pairs", "train-your-gut-race-fueling",
  "good-running-shoes-under-120"
]);
const PR_ALLOWED = [/^content\/rundown\/[a-z0-9-]+\.md$/, /^content\/guides\.json$/, /^content\/topics\.md$/, /^content\/site-paths\.txt$/];

// Data pages generated from the database. When the live sitemap can't be
// read (the routine's sandbox may have no network), links of these shapes are
// accepted on their form alone; the routine must still confirm each one exists.
const GENERATED = [
  /^\/shoes\/best\/[a-z0-9-]+$/, /^\/shoes\/compare\/[a-z0-9-]+-vs-[a-z0-9-]+$/,
  /^\/music\/(bpm|pace|genre|workout|artist)\/[a-z0-9-]+(\/[a-z0-9-]+)?$/,
  /^\/fuel\/(gels|compare|best)\/[a-z0-9-]+$/, /^\/fuel\/plan\/[a-z0-9-]+\/[a-z0-9-]+$/,
  /^\/rundown\/tag\/[a-z0-9-]+$/
];

const BANNED = [
  "delve", "crucial", "essential", "game-changer", "game changer", "elevate", "unleash", "robust",
  "seamless", "in today's world", "the world of running", "it's important to note", "it is important to note",
  "it's worth mentioning", "keep in mind", "whether you're a", "whether you are a", "in conclusion",
  "navigate the", "tapestry", "embark", "look no further", "buckle up", "let's dive", "dive into"
];

const args = new Set(process.argv.slice(2));
const errors = [];
const fail = (file, message) => errors.push(`${file}: ${message}`);

function parse(raw, file) {
  const match = raw.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    fail(file, "missing --- frontmatter ---");
    return null;
  }
  const meta = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return {
    slug: meta.slug ?? "",
    title: meta.title ?? "",
    excerpt: meta.excerpt ?? "",
    tags: (meta.tags ?? "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
    author: meta.author || "Runner Toolkit",
    published_at: meta.published_at || null,
    body: match[2].trim()
  };
}

async function knownPaths() {
  // The live sitemap lists every page that exists. Fall back to the repo's
  // own data when the site can't be reached.
  const paths = new Set(["/", "/tools/shoe-selector", "/tools/music", "/tools/fueling", "/tools/pace-calculator",
    "/tools/attire-guide", "/shoes", "/shoes/best", "/music", "/fuel", "/rundown", "/methodology", "/about"]);
  let live = false;
  try {
    const res = await fetch(`${SITE}/sitemap.xml`, { signal: AbortSignal.timeout(20000) });
    if (res.ok) {
      const xml = await res.text();
      for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) paths.add(new URL(m[1]).pathname.replace(/\/$/, "") || "/");
      live = paths.size > 100;
    }
  } catch {
    // offline: use repo data below
  }
  // Offline (the routine's sandbox can't reach the site): use the page list a
  // GitHub Action refreshes every day from the live sitemap.
  const snapshot = path.join(ROOT, "content", "site-paths.txt");
  if (!live && fs.existsSync(snapshot)) {
    for (const line of fs.readFileSync(snapshot, "utf8").split(/\r?\n/)) if (line.trim()) paths.add(line.trim());
    live = paths.size > 100;
  }
  const shoes = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "shoe-models-authored.json"), "utf8"));
  for (const shoe of Array.isArray(shoes) ? shoes : shoes.shoes ?? []) paths.add(`/shoes/${shoe.item_key}`);
  return { paths, live };
}

function checkGuide(guide, file, known, slugs) {
  const expected = path.basename(file, ".md");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(guide.slug)) fail(file, `slug "${guide.slug}" must be lowercase-hyphenated`);
  if (guide.slug !== expected) fail(file, `slug "${guide.slug}" must match the file name "${expected}"`);
  if (guide.title.length < 15 || guide.title.length > 95) fail(file, `title must be 15-95 characters (is ${guide.title.length})`);
  if (guide.excerpt.length < 40 || guide.excerpt.length > 240) fail(file, `excerpt must be 40-240 characters (is ${guide.excerpt.length})`);
  if (!guide.tags.length) fail(file, "needs at least one tag");
  if (LEGACY.has(guide.slug)) return;
  if ((guide.excerpt.match(/[.!?](\s|$)/g) ?? []).length > 2) fail(file, "excerpt is two sentences at most");
  for (const tag of guide.tags) if (!TAGS.has(tag)) fail(file, `tag "${tag}" is not one of ${[...TAGS].join(", ")}`);
  if (guide.published_at && Number.isNaN(Date.parse(guide.published_at))) fail(file, "published_at is not a date");

  const words = guide.body.split(/\s+/).filter(Boolean).length;
  if (words < 600 || words > 2200) fail(file, `body must be 600-2200 words (is ${words})`);

  const all = `${guide.title}\n${guide.excerpt}\n${guide.body}`;
  if (all.includes("—")) fail(file, "em dash found; the site uses none");
  if (/ – /.test(all)) fail(file, "spaced en dash used as a dash; rewrite the sentence");
  const lower = all.toLowerCase().replace(/’/g, "'");
  for (const phrase of BANNED) if (lower.includes(phrase)) fail(file, `banned phrase "${phrase}" (CONTENT_VOICE.md)`);

  const lines = guide.body.split("\n");
  for (const line of lines) {
    if (/^\s*\|/.test(line)) fail(file, "tables are not supported by the renderer");
    if (/^\s*\d+[.)]\s/.test(line)) fail(file, "numbered lists are not supported; use - lists");
    if (/!\[/.test(line)) fail(file, "images are not supported");
    if (/^#\s/.test(line)) fail(file, "use ## and ### only; the title is the h1");
  }
  const headings = lines.filter((line) => /^##\s/.test(line));
  if (headings.length < 2) fail(file, "needs at least two ## sections");
  if (headings.some((h) => /^##+\s*(conclusion|summary|final thoughts|wrapping up|the bottom line)\b/i.test(h))) {
    fail(file, "no conclusion section (CONTENT_VOICE.md)");
  }
  const last = lines.filter((line) => line.trim()).at(-1) ?? "";
  if (/^(ultimately|in the end|overall),/i.test(last.trim())) fail(file, 'last line must not open with "Ultimately"/"Overall"');

  const links = [...guide.body.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
  const internal = links.filter((href) => href.startsWith("/"));
  if (internal.length < 3) fail(file, `needs at least 3 internal links (has ${internal.length})`);
  for (const href of internal) {
    const clean = href.split(/[?#]/)[0].replace(/\/$/, "") || "/";
    const rundown = clean.match(/^\/rundown\/([a-z0-9-]+)$/);
    const offlineOk = !known.live && GENERATED.some((re) => re.test(clean));
    if (rundown ? !slugs.has(rundown[1]) && !known.paths.has(clean) : !known.paths.has(clean) && !offlineOk) {
      fail(file, `link ${href} points to a page that doesn't exist`);
    }
  }
  for (const href of links.filter((h) => !h.startsWith("/"))) {
    if (!/^https:\/\//.test(href)) fail(file, `external link ${href} must be https`);
  }
}

function checkDiff(existingFiles) {
  execSync("git fetch -q origin main", { cwd: ROOT, stdio: "inherit" });
  const out = execSync("git diff --name-status origin/main...HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
  if (!out) {
    errors.push("diff: branch has no changes against origin/main");
    return;
  }
  let added = 0;
  for (const line of out.split("\n")) {
    const [status, file] = line.split("\t");
    if (!PR_ALLOWED.some((re) => re.test(file))) errors.push(`diff: ${file} is outside what the guide routine may change`);
    if (status.startsWith("D") && file.startsWith("content/rundown/")) errors.push(`diff: ${file} deletes a published guide`);
    if (status.startsWith("A") && file.startsWith("content/rundown/")) added += 1;
  }
  if (added > MAX_NEW_PER_PR) errors.push(`diff: ${added} new guides; limit is ${MAX_NEW_PER_PR} per PR`);
  // The bundle must match the guides on the branch.
  const bundle = fs.existsSync(BUNDLE) ? JSON.parse(fs.readFileSync(BUNDLE, "utf8")) : { guides: [] };
  if (bundle.guides.length !== existingFiles.length) errors.push("diff: content/guides.json is stale; rerun with --write");
}

const files = fs.readdirSync(GUIDE_DIR).filter((f) => f.endsWith(".md")).sort();
const known = await knownPaths();
const guides = [];
const slugs = new Set(files.map((f) => path.basename(f, ".md")));
for (const name of files) {
  const file = `content/rundown/${name}`;
  const guide = parse(fs.readFileSync(path.join(GUIDE_DIR, name), "utf8"), file);
  if (!guide) continue;
  checkGuide(guide, file, known, slugs);
  guides.push(guide);
}
const titles = new Map();
for (const guide of guides) {
  const key = guide.title.toLowerCase();
  if (titles.has(key)) errors.push(`${guide.slug}: same title as ${titles.get(key)}`);
  titles.set(key, guide.slug);
}

if (args.has("--write") && !errors.length) {
  guides.sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? "") || a.slug.localeCompare(b.slug));
  fs.writeFileSync(BUNDLE, JSON.stringify({ generated: new Date().toISOString(), count: guides.length, guides }, null, 2) + "\n");
  console.log(`Wrote content/guides.json with ${guides.length} guides.`);
}
if (args.has("--pr")) checkDiff(files);

if (!known.live) console.log("Note: no sitemap or content/site-paths.txt, links checked against repo data only.");
if (errors.length) {
  console.error(`
${errors.length} problem(s):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exitCode = 1;
} else {
  console.log(`OK: ${guides.length} guides pass.`);
}
