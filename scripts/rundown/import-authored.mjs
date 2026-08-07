/**
 * Import repo-authored guides (content/rundown/*.md) into the articles table.
 *
 * Frontmatter (--- delimited, key: value; tags comma-separated):
 *   slug, title, excerpt, tags, author, published_at (optional ISO)
 *
 * Usage:
 *   node scripts/rundown/import-authored.mjs            — import/update as published
 *   node scripts/rundown/import-authored.mjs --draft    — import as unpublished drafts
 *   node scripts/rundown/import-authored.mjs --file content/rundown/foo.md
 *
 * Voice check: every guide must follow CONTENT_VOICE.md before it lands here.
 */

import "../load-env.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, "..", "..", "content", "rundown");

const parseArticle = (raw, filename) => {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${filename}: missing frontmatter`);

  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }

  for (const required of ["slug", "title", "excerpt"]) {
    if (!meta[required]) throw new Error(`${filename}: frontmatter needs ${required}`);
  }

  return {
    slug: meta.slug,
    title: meta.title,
    excerpt: meta.excerpt,
    author: meta.author || "Runner Toolkit",
    tags: (meta.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
    published_at: meta.published_at || null,
    body: match[2].trim(),
  };
};

const run = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars.");
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const asDraft = process.argv.includes("--draft");
  const fileIdx = process.argv.indexOf("--file");
  const files =
    fileIdx !== -1
      ? [path.resolve(process.argv[fileIdx + 1])]
      : fs
          .readdirSync(CONTENT_DIR)
          .filter((f) => f.endsWith(".md"))
          .map((f) => path.join(CONTENT_DIR, f));

  for (const file of files) {
    const article = parseArticle(fs.readFileSync(file, "utf8"), path.basename(file));
    const now = new Date().toISOString();

    const { data: existing, error: readError } = await supabase
      .from("articles")
      .select("id, published_at, is_published")
      .eq("slug", article.slug)
      .maybeSingle();
    if (readError) {
      console.error(`${article.slug}: read failed — ${readError.message}`);
      process.exit(1);
    }

    const row = {
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      author: article.author,
      tags: article.tags,
      body: article.body,
      is_published: !asDraft,
      updated_at: now,
      // Keep the original publish date on re-import; only stamp new rows.
      published_at:
        existing?.published_at ?? article.published_at ?? now,
    };

    const { error } = existing
      ? await supabase.from("articles").update(row).eq("id", existing.id)
      : await supabase.from("articles").insert(row);

    if (error) {
      console.error(`${article.slug}: write failed — ${error.message}`);
      process.exit(1);
    }
    console.log(
      `${existing ? "Updated" : "Created"}: "${article.title}" → /rundown/${article.slug}${asDraft ? " (draft)" : ""}`
    );
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
