/**
 * Check every guide in content/rundown/*.md and (with --write) bundle them
 * into content/guides.json, which the live site syncs from.
 *
 *   node scripts/rundown/check-guides.mjs            check only
 *   node scripts/rundown/check-guides.mjs --write    check, then write the bundle
 *   node scripts/rundown/check-guides.mjs --pr       also check the branch's diff
 *                                                    against origin/main (the
 *                                                    routine's merge gate)
 *   node scripts/rundown/check-guides.mjs --words    also print each guide's length
 *
 * No npm install needed: Node built-ins only. Exit code 1 on any failure.
 * The rules are CONTENT_VOICE.md made mechanical, and every guide is held to
 * all of them: there are no exemptions. Never loosen a rule to get a guide
 * through; rewrite the guide.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const GUIDE_DIR = path.join(ROOT, "content", "rundown");
const BUNDLE = path.join(ROOT, "content", "guides.json");
const SITE = "https://runnertoolkit.com";

// "news" keeps a dated news piece off the guide index (lib/guides.ts) while
// its page stays up. Every guide still needs one of the topic tags.
const TAGS = new Set(["shoes", "gear", "music", "fueling", "training", "race-day", "beginners", "nutrition"]);
const SPECIAL_TAGS = new Set(["news"]);
const MAX_NEW_PER_PR = 8;
const PR_ALLOWED = [/^content\/rundown\/[a-z0-9-]+\.md$/, /^content\/guides\.json$/, /^content\/topics\.md$/, /^content\/site-paths\.txt$/];

const WORDS = { min: 350, max: 900 };
const SHORT_ANSWER = { maxWords: 50, maxSentences: 2 };
const MAX_SENTENCE_WORDS = 35;
const MAX_PARAGRAPH = { sentences: 4, words: 90 };
const MAX_SECTION_WORDS = 230;
const LINKS = { min: 3, max: 8 };
const MAX_BOLD_LABELS = 2;

// Data pages generated from the database. When the live sitemap can't be
// read (the routine's sandbox may have no network), links of these shapes are
// accepted on their form alone; the routine must still confirm each one exists.
const GENERATED = [
  /^\/shoes\/best\/[a-z0-9-]+$/, /^\/shoes\/compare\/[a-z0-9-]+-vs-[a-z0-9-]+$/,
  /^\/music\/(bpm|pace|genre|workout|artist)\/[a-z0-9-]+(\/[a-z0-9-]+)?$/,
  /^\/fuel\/(gels|compare|best)\/[a-z0-9-]+$/, /^\/fuel\/plan\/[a-z0-9-]+\/[a-z0-9-]+$/,
  /^\/rundown\/tag\/[a-z0-9-]+$/
];

// AI tells and filler, matched as whole words (case-insensitive, curly
// apostrophes straightened) in the title, excerpt and body.
const BANNED = [
  // throat-clearing openers and signposts
  "here's the thing", "here's the deal", "here's the catch", "here's how", "here's where", "here's what",
  "here's why", "here is the", "here are the", "the short version", "the long version", "the bottom line",
  "bottom line", "that said", "that being said", "with that said", "the truth is", "the reality is",
  "the honest answer", "the honest summary", "the real answer", "the good news", "the bad news",
  "the catch is", "the key is", "key takeaway", "takeaways", "pro tip", "quick tip", "fun fact", "spoiler",
  "my position", "my take", "my answer", "my advice", "let's", "let us", "honestly", "to be honest",
  "truth be told", "in a nutshell", "at the end of the day", "simply put", "put simply", "in other words",
  "think of it as", "believe it or not", "it goes without saying", "needless to say", "rest assured",
  "first and foremost", "last but not least", "without further ado", "when it comes to",
  // summaries
  "in conclusion", "in summary", "to sum up", "to summarize", "all in all", "ultimately", "in the end",
  "at its core", "the beauty of",
  // hype and corporate verbs
  "game-changer", "game changer", "unlock", "unleash", "elevate", "elevates", "elevating", "level up",
  "next level", "supercharge", "empower", "navigate", "journey", "delve", "dive into", "deep dive",
  "dial in", "dialed in", "sweet spot", "secret sauce", "no-brainer", "must-have", "a must", "hack",
  "embark", "buckle up", "look no further", "tapestry", "testament", "realm", "landscape", "myriad",
  "plethora", "foster", "leverage", "harness", "holistic", "synergy", "ever-evolving", "in today's",
  "the world of running", "the magic happens", "trust the process", "you've got this", "happy running",
  "we've got you", "you're not alone",
  // inflated adjectives and adverbs
  "crucial", "essential", "robust", "seamless", "vital", "pivotal", "paramount", "comprehensive",
  "straightforward", "nuanced", "meticulous", "incredibly", "absolutely", "definitely", "genuinely",
  "truly", "really", "actually", "basically", "literally", "obviously", "clearly", "of course", "amazing",
  "stunning", "exciting", "excited", "thrilled",
  // hedges and filler
  "it's important to note", "it is important to note", "it's worth noting", "worth mentioning",
  "keep in mind", "bear in mind", "it's no secret", "whether you're", "whether you are",
  "moreover", "furthermore", "additionally", "notably", "importantly", "interestingly",
  "strike a balance", "striking a balance", "may potentially", "could potentially"
];
// Word stems banned in every form (navigates, unlocking, essentially...).
const BANNED_STEMS = ["navigat", "unlock", "unleash", "empower", "supercharg", "delv", "embark", "journey",
  "seamless", "crucial", "essential", "game-chang", "leverag"];

// Sentence shapes that read as machine-written.
const PATTERNS = [
  { re: /\b(?:it|this|that)(?:'s| is) not (?:just |only |about |really )?[^.;:!?\n]{1,60}[,;:]\s*(?:it|this|that)(?:'s| is)\b/i, why: '"it\'s not X, it\'s Y" framing' },
  { re: /\b(?:isn't|is not|aren't|are not) (?:just |only |about )?[^.;:!?\n]{1,50}\.\s+(?:it|this|that|they)(?:'s| is| are|'re)\b/i, why: '"isn\'t X. It\'s Y" framing' },
  { re: /\bnot (?:just|only|merely) [^.;!?\n]{1,60},? but (?:also )?\b/i, why: '"not just X, but Y" framing' },
  { re: /\bless about [^.;!?\n]{1,50} and more about\b/i, why: '"less about X, more about Y" framing' },
  { re: /\bthe (?:answer|question|problem|secret|trick|point) (?:is|isn't) (?:simple|this)\b/i, why: "a setup line instead of the point" },
  { re: /\b(?:so|now),? (?:what|how|why|where|which)\b[^.!?\n]*\?/i, why: "rhetorical-question transition" }
];

// Adjectives that show up in "light, responsive, and versatile" stacks.
const STACK_ADJECTIVES = new Set(
  ("light lightweight responsive versatile smooth soft plush bouncy snappy fast quick comfortable durable " +
    "stable protective breathable reliable simple easy fun lively springy cushioned supportive nimble " +
    "efficient effective powerful premium sleek stylish affordable flexible firm energetic dependable " +
    "accessible practical intuitive friendly clean natural tasty convenient portable").split(" ")
);

// First person singular: the site has no single narrator, and an AI that
// writes "I've bonked at mile 22" is inventing a life.
const FIRST_PERSON = /(^|[^\w'])(I|I'm|I've|I'd|I'll|me|my|mine|myself)(?=[^\w']|$)/;

const LABEL_HEADINGS = /^##+\s*(overview|introduction|intro|background|conclusion|summary|final thoughts|wrapping up|the bottom line|faq|faqs|why it matters|what to know|key takeaways|takeaways|the verdict|verdict|next steps)\s*$/i;
const CLOSING_OPENERS = /^(ultimately|in the end|overall|in short|so,|all in all|to sum up|in summary|bottom line|the bottom line|remember,)/i;

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
    "/shoes", "/shoes/best", "/music", "/fuel", "/rundown", "/methodology", "/about"]);
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
  // Offline (the routine's sandbox can't reach the site): use the page list
  // kept in the repo from the live sitemap.
  const snapshot = path.join(ROOT, "content", "site-paths.txt");
  if (!live && fs.existsSync(snapshot)) {
    for (const line of fs.readFileSync(snapshot, "utf8").split(/\r?\n/)) if (line.trim()) paths.add(line.trim());
    live = paths.size > 100;
  }
  const shoes = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "shoe-models-authored.json"), "utf8"));
  for (const shoe of Array.isArray(shoes) ? shoes : shoes.shoes ?? []) paths.add(`/shoes/${shoe.item_key}`);
  return { paths, live };
}

const countWords = (text) => text.split(/\s+/).filter(Boolean).length;
// Link targets and bold marks are not words a reader reads.
const plain = (text) => text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, "");
const sentences = (text) =>
  plain(text)
    .replace(/\b(?:e\.g|i\.e|vs|etc|approx|St|Dr|Mt|No)\./g, (m) => m.replace(/\./g, "_"))
    .replace(/\bU\.S\./g, "US")
    .replace(/(\d)\.(\d)/g, "$1_$2")
    .split(/(?<=[.!?])["”)]?\s+(?=["“(]?[A-Z0-9$])/)
    .map((s) => s.trim())
    .filter(Boolean);
const outsideQuotes = (text) => text.replace(/"[^"\n]*"|“[^”\n]*”/g, '""');
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function checkVoice(guide, file) {
  const all = `${guide.title}\n${guide.excerpt}\n${guide.body}`;
  if (all.includes("—")) fail(file, "em dash found; the site uses none");
  if (all.includes("–")) fail(file, 'en dash found; write ranges as "3 to 5" and turn dashes into sentences');
  if (/\s-\s|--/.test(all.replace(/^\s*- /gm, ""))) fail(file, "hyphen used as a dash; rewrite the sentence");
  if (/!(?!\[)/.test(plain(all))) fail(file, "exclamation mark found");

  const lower = all.toLowerCase().replace(/[’‘]/g, "'");
  for (const phrase of BANNED) {
    const re = new RegExp(`(^|[^a-z'-])${escapeRe(phrase)}(?=$|[^a-z'-])`, "i");
    if (re.test(lower)) fail(file, `banned phrase "${phrase}" (CONTENT_VOICE.md)`);
  }
  for (const stem of BANNED_STEMS) {
    const m = lower.match(new RegExp(`(?:^|[^a-z'-])(${escapeRe(stem)}[a-z]*)`));
    if (m && !BANNED.includes(m[1])) fail(file, `banned word "${m[1]}" (CONTENT_VOICE.md)`);
  }
  const straight = all.replace(/[’‘]/g, "'");
  for (const { re, why } of PATTERNS) {
    const hit = straight.match(re);
    if (hit) fail(file, `${why}: "${hit[0].trim().slice(0, 80)}"`);
  }
  for (const m of plain(straight).matchAll(/\b([a-z-]+), ([a-z-]+),? (?:and|or) ([a-z-]+)\b/gi)) {
    if ([m[1], m[2], m[3]].every((w) => STACK_ADJECTIVES.has(w.toLowerCase()))) fail(file, `triplet adjective stack "${m[0]}"`);
  }
  const fp = outsideQuotes(plain(`${guide.excerpt}\n${guide.body}`).replace(/[’‘]/g, "'")).match(FIRST_PERSON);
  if (fp) fail(file, `first person singular "${fp[2]}": no narrator and no invented anecdotes`);
}

function checkBody(guide, file, known, slugs) {
  const body = guide.body;
  const blocks = body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  // 1. The Short answer callout comes first.
  const first = blocks[0] ?? "";
  const short = first.match(/^\*\*Short answer:\*\*\s+(.+)$/s);
  if (!short) {
    fail(file, 'body must open with a "**Short answer:** ..." paragraph (one or two sentences)');
  } else {
    const text = short[1].trim();
    if (/\n/.test(text)) fail(file, "the Short answer is one paragraph on one line");
    if (/\*\*/.test(text)) fail(file, "no extra bold inside the Short answer");
    const n = sentences(text).length;
    if (n > SHORT_ANSWER.maxSentences) fail(file, `the Short answer is ${SHORT_ANSWER.maxSentences} sentences at most (is ${n})`);
    const w = countWords(plain(text));
    if (w > SHORT_ANSWER.maxWords) fail(file, `the Short answer is ${SHORT_ANSWER.maxWords} words at most (is ${w})`);
  }
  if (blocks.slice(1).some((b) => /^\*\*Short answer/i.test(b))) fail(file, "only one Short answer");

  // 2. Length.
  const words = countWords(plain(body));
  if (words < WORDS.min || words > WORDS.max) fail(file, `body must be ${WORDS.min}-${WORDS.max} words (is ${words})`);

  // 3. Only what the renderer supports.
  const lines = body.split("\n");
  for (const line of lines) {
    if (/^\s*\|/.test(line)) fail(file, "tables are not supported by the renderer");
    if (/^\s*\d+[.)]\s/.test(line)) fail(file, "numbered lists are not supported; use - lists");
    if (/!\[/.test(line)) fail(file, "images are not supported");
    if (/^#\s/.test(line)) fail(file, "use ## and ### only; the title is the h1");
    if (/^####/.test(line)) fail(file, "use ## and ### only");
    if (/^\s*[*+]\s/.test(line)) fail(file, 'lists use "- " only');
  }

  // 4. Short sections, headed by the answer: never a label, never a question.
  const headings = lines.filter((line) => /^##+\s/.test(line));
  if (lines.filter((line) => /^##\s/.test(line)).length < 3) fail(file, "needs at least three ## sections");
  for (const h of headings) {
    const text = h.replace(/^#+\s*/, "");
    if (LABEL_HEADINGS.test(h)) fail(file, `heading "${text}" is a label; headings state the answer`);
    if (/\?\s*$/.test(text)) fail(file, `heading "${text}" is a question; headings state the answer`);
    if (countWords(text) < 3) fail(file, `heading "${text}" is too short to say anything`);
    if (text.length > 80) fail(file, `heading "${text.slice(0, 40)}..." is over 80 characters`);
    if (/^(step|part|tip|mistake|reason)\s*\d/i.test(text) || /^\d+[.)]\s/.test(text)) fail(file, `heading "${text}" is numbered; say the point`);
  }
  let section = 0;
  let sectionName = "the intro";
  for (const block of blocks.slice(1)) {
    if (/^##\s/.test(block)) {
      section = 0;
      sectionName = block.replace(/^#+\s*/, "").split("\n")[0];
      continue;
    }
    section += countWords(plain(block));
    if (section > MAX_SECTION_WORDS) {
      fail(file, `section "${sectionName}" runs over ${MAX_SECTION_WORDS} words; split it or cut it`);
      section = -Infinity;
    }
  }

  // 5. Paragraphs and sentences short enough to scan.
  let hasList = false;
  let boldLabels = 0;
  for (const block of blocks.slice(1)) {
    if (/^#/.test(block)) continue;
    const blockLines = block.split("\n");
    if (blockLines.every((l) => /^\s*- /.test(l))) {
      hasList = true;
      for (const item of blockLines) {
        if (/^\s*- \*\*[^*]+:\*\*/.test(item) || /^\s*- \*\*[^*]+\*\*:/.test(item)) boldLabels += 1;
        for (const s of sentences(item.replace(/^\s*- /, ""))) {
          if (countWords(s) > MAX_SENTENCE_WORDS) fail(file, `sentence over ${MAX_SENTENCE_WORDS} words: "${s.slice(0, 70)}..."`);
        }
      }
      continue;
    }
    if (/^\*\*[^*]+:\*\*/.test(block)) boldLabels += 1;
    const ss = sentences(block);
    const w = countWords(plain(block));
    if (ss.length > MAX_PARAGRAPH.sentences || w > MAX_PARAGRAPH.words) {
      fail(file, `paragraph too long (${ss.length} sentences, ${w} words; max ${MAX_PARAGRAPH.sentences} and ${MAX_PARAGRAPH.words}): "${block.slice(0, 60)}..."`);
    }
    for (const s of ss) if (countWords(s) > MAX_SENTENCE_WORDS) fail(file, `sentence over ${MAX_SENTENCE_WORDS} words: "${s.slice(0, 70)}..."`);
  }
  if (!hasList) fail(file, "needs at least one - list where a list helps the reader scan");
  if (boldLabels > MAX_BOLD_LABELS) fail(file, `"**Label:** text" used ${boldLabels} times; ${MAX_BOLD_LABELS} at most`);
  if (/\?/.test(outsideQuotes(plain(body.replace(/^##.*$/gm, ""))))) {
    fail(file, "question mark in the body; answer instead of asking (a quoted search is fine)");
  }

  // 6. No closing summary.
  const last = blocks.at(-1) ?? "";
  if (CLOSING_OPENERS.test(plain(last))) fail(file, "last paragraph reads as a summary; end on the last useful point");
  if (/^##\s/.test(last)) fail(file, "ends on a heading");

  // 7. Links.
  const links = [...body.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
  const internal = links.filter((href) => href.startsWith("/"));
  if (internal.length < LINKS.min || internal.length > LINKS.max) fail(file, `needs ${LINKS.min}-${LINKS.max} internal links (has ${internal.length})`);
  for (const m of body.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
    if (/^(click here|here|this|this page|link|read more|this guide)$/i.test(m[1].trim())) fail(file, `link text "${m[1]}" says nothing; describe the page`);
  }
  for (const href of internal) {
    const clean = href.split(/[?#]/)[0].replace(/\/$/, "") || "/";
    const rundown = clean.match(/^\/rundown\/([a-z0-9-]+)$/);
    const offlineOk = !known.live && GENERATED.some((re) => re.test(clean));
    if (rundown ? !slugs.has(rundown[1]) && !known.paths.has(clean) : !known.paths.has(clean) && !offlineOk) {
      fail(file, `link ${href} points to a page that doesn't exist`);
    }
    if (clean === `/rundown/${guide.slug}`) fail(file, "links to itself");
  }
  for (const href of links.filter((h) => !h.startsWith("/"))) {
    if (!/^https:\/\//.test(href)) fail(file, `external link ${href} must be https`);
  }
}

function checkGuide(guide, file, known, slugs) {
  const expected = path.basename(file, ".md");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(guide.slug)) fail(file, `slug "${guide.slug}" must be lowercase-hyphenated`);
  if (guide.slug !== expected) fail(file, `slug "${guide.slug}" must match the file name "${expected}"`);
  if (guide.title.length < 15 || guide.title.length > 95) fail(file, `title must be 15-95 characters (is ${guide.title.length})`);
  if (guide.excerpt.length < 40 || guide.excerpt.length > 240) fail(file, `excerpt must be 40-240 characters (is ${guide.excerpt.length})`);
  if (sentences(guide.excerpt).length > 2) fail(file, "excerpt is two sentences at most");
  if (/\?/.test(guide.excerpt)) fail(file, "the excerpt answers; it doesn't ask");
  if (!guide.tags.some((tag) => TAGS.has(tag))) fail(file, `needs at least one of ${[...TAGS].join(", ")}`);
  for (const tag of guide.tags) {
    if (!TAGS.has(tag) && !SPECIAL_TAGS.has(tag)) fail(file, `tag "${tag}" is not one of ${[...TAGS, ...SPECIAL_TAGS].join(", ")}`);
  }
  if (!guide.published_at || Number.isNaN(Date.parse(guide.published_at))) fail(file, "published_at must be a date");
  checkVoice(guide, file);
  checkBody(guide, file, known, slugs);
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
if (args.has("--words")) {
  for (const guide of guides) console.log(`${String(countWords(plain(guide.body))).padStart(4)}  ${guide.slug}`);
}
if (errors.length) {
  console.error(`
${errors.length} problem(s):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exitCode = 1;
} else {
  console.log(`OK: ${guides.length} guides pass.`);
}
