/*
 * How good is the preview tempo reader? Compares it with GetSongBPM on every
 * song where we have both (rows that came with a GetSongBPM tempo, and songs
 * GetSongBPM matched during the backfill).
 *
 *   node scripts/music/run.mjs validate-tempo
 *
 * Prints accuracy within 3 BPM, within 3 BPM allowing half or double, and the
 * share whose running stride agrees, for every reading and for the ones the
 * reader trusts (the only ones the site uses).
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { foldTempo, stepRate } from "../../lib/music/catalog-rules";
import { loadLibrary } from "../../lib/music/ingest";

const dir = path.resolve(".tmp", "music");
const readJsonl = <T>(name: string): T[] =>
  fs.existsSync(path.join(dir, name))
    ? fs
        .readFileSync(path.join(dir, name), "utf8")
        .split("\n")
        .filter(Boolean)
        .map((l) => JSON.parse(l) as T)
    : [];

type Analysis = { bpm: number; confidence: number; trusted?: boolean } | null;

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const rows = await loadLibrary(db);
const byId = new Map(rows.map((r) => [r.id, r]));

const pairs: { truth: number; analysis: number; confidence: number; trusted: boolean; title: string }[] = [];

// Rows that arrived with GetSongBPM tempos, read again from their previews.
const original = JSON.parse(fs.existsSync(path.join(dir, "original-rows.json")) ? fs.readFileSync(path.join(dir, "original-rows.json"), "utf8") : "[]") as { id: string; bpm: number | null; source: string | null; title: string }[];
const originalGetsong = new Map(original.filter((r) => r.source === "getsongbpm" && r.bpm).map((r) => [r.id, r]));
for (const line of readJsonl<{ rowId: string; analysis?: Analysis }>("existing.jsonl")) {
  const known = originalGetsong.get(line.rowId);
  if (known && line.analysis) pairs.push({ truth: known.bpm!, analysis: line.analysis.bpm, confidence: line.analysis.confidence, trusted: Boolean(line.analysis.trusted), title: known.title });
}

// New songs GetSongBPM matched after the reader had already read them.
const detailById = new Map<number, Analysis>();
for (const line of readJsonl<{ track?: { id: number }; analysis?: Analysis }>("details.jsonl")) if (line.track) detailById.set(line.track.id, line.analysis ?? null);
for (const line of readJsonl<{ id: string; bpm: number | null }>("getsong.jsonl")) {
  if (!line.bpm) continue;
  const row = byId.get(line.id);
  const analysis = row?.deezer_id ? detailById.get(Number(row.deezer_id)) : null;
  if (row && analysis && !originalGetsong.has(row.id)) pairs.push({ truth: line.bpm, analysis: analysis.bpm, confidence: analysis.confidence, trusted: Boolean(analysis.trusted), title: row.title });
}
// New candidates GetSongBPM knew before they reached the table.
const titles = new Map<number, string>();
for (const line of readJsonl<{ track?: { id: number; title: string } }>("details.jsonl")) if (line.track) titles.set(line.track.id, line.track.title);
for (const line of readJsonl<{ deezerId: number; bpm: number | null }>("getsong-pre.jsonl")) {
  const analysis = detailById.get(line.deezerId);
  if (line.bpm && analysis) pairs.push({ truth: line.bpm, analysis: analysis.bpm, confidence: analysis.confidence, trusted: Boolean(analysis.trusted), title: titles.get(line.deezerId) ?? "" });
}

const within = (a: number, b: number, tol = 3) => Math.abs(a - b) <= tol;
const octave = (a: number, b: number) => within(a, b) || within(a * 2, b) || within(a / 2, b, 1.5);
const stride = (a: number, b: number) => {
  const sa = stepRate(Math.round(a));
  const sb = stepRate(Math.round(b));
  if (!sa && !sb) return true;
  return Boolean(sa && sb && within(sa.steps, sb.steps));
};

const report = (label: string, list: typeof pairs) => {
  const n = list.length;
  if (!n) return console.log(label, "no pairs");
  const exact = list.filter((p) => within(foldTempo(p.analysis), p.truth)).length;
  const oct = list.filter((p) => octave(foldTempo(p.analysis), p.truth)).length;
  const str = list.filter((p) => stride(foldTempo(p.analysis), p.truth)).length;
  const pct = (x: number) => `${((100 * x) / n).toFixed(1)}%`;
  console.log(`${label.padEnd(22)} n=${String(n).padStart(5)}  within 3: ${pct(exact)}  half/double ok: ${pct(oct)}  same stride: ${pct(str)}`);
};

console.log(`Validation pairs: ${pairs.length}`);
report("every reading", pairs);
report("trusted readings", pairs.filter((p) => p.trusted));
console.log(`trusted share: ${((100 * pairs.filter((p) => p.trusted).length) / Math.max(1, pairs.length)).toFixed(1)}%`);
const misses = pairs.filter((p) => p.trusted && !octave(foldTempo(p.analysis), p.truth)).slice(0, 15);
console.log("Sample misses:", misses.map((m) => `${m.title}: read ${m.analysis}, GetSongBPM ${m.truth}`));
fs.writeFileSync(path.join(dir, "validation.json"), JSON.stringify(pairs));
