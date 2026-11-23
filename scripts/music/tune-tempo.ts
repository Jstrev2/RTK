/*
 * Tries tempo-reader settings on cached previews with known GetSongBPM tempos
 * (.tmp/music/audio).   node scripts/music/run.mjs tune-tempo
 */
import fs from "fs";
import { decodeMp3, onsetEnvelope, tempoFromEnvelope, TEMPO_PARAMS, type TempoParams } from "../../lib/music/tempo";
import { foldTempo, stepRate } from "../../lib/music/catalog-rules";

const index = JSON.parse(fs.readFileSync(".tmp/music/audio/index.json", "utf8")) as { file: string; title: string; bpm: number }[];
type S = { env: Float64Array; low: Float64Array; mix: Float64Array; fps: number; bpm: number; title: string };
const songs: S[] = [];
const norm = (a: Float64Array) => {
  let m = 0;
  for (const v of a) m += v;
  m = m / a.length || 1;
  return a.map((v) => v / m);
};
for (const item of index) {
  try {
    const { samples, sampleRate } = await decodeMp3(new Uint8Array(fs.readFileSync(item.file)));
    const { envelope, lowEnvelope, fps } = onsetEnvelope(samples, sampleRate);
    const a = norm(envelope), b = norm(lowEnvelope);
    songs.push({ env: envelope, low: lowEnvelope, mix: a.map((v, i) => v + b[i]), fps, bpm: item.bpm, title: item.title });
  } catch {
    /* skip */
  }
}
console.log("songs", songs.length);
const within = (a: number, b: number) => Math.abs(a - b) <= 3;
const octaveOk = (v: number, t: number) => within(v, t) || within(v * 2, t) || within(v / 2, t);
const score = (rows: { v: number; t: number }[]) => {
  const n = rows.length;
  const exact = rows.filter((r) => within(r.v, r.t)).length;
  const oct = rows.filter((r) => octaveOk(r.v, r.t)).length;
  const str = rows.filter((r) => {
    const a = stepRate(Math.round(r.v)), b = stepRate(r.t);
    return (!a && !b) || (a && b && within(a.steps, b.steps));
  }).length;
  return { n, exact: +(exact / n).toFixed(3), octave: +(oct / n).toFixed(3), stride: +(str / n).toFixed(3) };
};
const run = (pick: (s: S) => Float64Array, params: Partial<TempoParams> = {}) =>
  songs.map((s) => ({ s, r: tempoFromEnvelope(pick(s), s.fps, { ...TEMPO_PARAMS, ...params }) }));

const full = run((s) => s.env);
const low = run((s) => s.low);
const mix = run((s) => s.mix);
const rows = (list: typeof full) => list.map(({ s, r }) => ({ v: foldTempo(r.bpm), t: s.bpm }));
console.log("full ", score(rows(full)));
console.log("low  ", score(rows(low)));
console.log("mix  ", score(rows(mix)));
console.log("mix c125", score(rows(run((s) => s.mix, { center: 125 }))));
// Agreement: full and low agree (octave-tolerant) -> trusted.
const agree = full.map((f, i) => ({ f, l: low[i], m: mix[i] })).filter(({ f, l }) => octaveOk(foldTempo(f.r.bpm), foldTempo(l.r.bpm)) || octaveOk(foldTempo(l.r.bpm), foldTempo(f.r.bpm)));
console.log("full~low agree", score(agree.map(({ f }) => ({ v: foldTempo(f.r.bpm), t: f.s.bpm }))));
const agree3 = full.map((f, i) => ({ f, l: low[i], m: mix[i] })).filter(({ f, m }) => octaveOk(foldTempo(f.r.bpm), foldTempo(m.r.bpm)));
console.log("full~mix agree", score(agree3.map(({ m }) => ({ v: foldTempo(m.r.bpm), t: m.s.bpm }))));
for (const c of [1.2, 1.4, 1.6, 9]) {
  const pick = full.map((f, i) => ({ f, l: low[i] })).filter(({ f, l }) => octaveOk(foldTempo(f.r.bpm), foldTempo(l.r.bpm)) || f.r.confidence >= c);
  console.log(`agree or conf>=${c}`, score(pick.map(({ f }) => ({ v: foldTempo(f.r.bpm), t: f.s.bpm }))));
}
for (const c of [1.0, 1.1, 1.2]) {
  const pick = full.map((f, i) => ({ f, l: low[i] })).filter(({ f, l }) => octaveOk(foldTempo(f.r.bpm), foldTempo(l.r.bpm)) && f.r.confidence >= c);
  console.log(`agree and conf>=${c}`, score(pick.map(({ f }) => ({ v: foldTempo(f.r.bpm), t: f.s.bpm }))));
}
