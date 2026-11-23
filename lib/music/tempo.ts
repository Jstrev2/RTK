import { MPEGDecoder } from "mpg123-decoder";

/*
 * Tempo from a 30-second preview MP3.
 *
 * 1. Decode to mono and drop to about 11 kHz.
 * 2. Onset envelope: log-compressed spectral flux, 11.6 ms frames, with the
 *    slow trend removed so only attacks remain.
 * 3. Candidate tempos: the envelope's autocorrelation, each lag helped by its
 *    multiples (a steady beat repeats at 2x and 4x the period too), weighted
 *    toward the tempos songs usually sit at so 60/120/240 resolve sensibly.
 * 4. Refine the winner to a tenth of a beat by fitting a pulse train over the
 *    whole clip.
 *
 * It also returns a rough intensity (loudness, attack strength and brightness)
 * that the catalog ranks into energy levels.
 *
 * Validated against GetSongBPM's tempos: see scripts/music/validate-tempo.ts.
 */

export type TempoResult = {
  bpm: number;
  /** How clearly the clip has one beat: the winning score over the runner-up's, 1 = no clear winner. */
  confidence: number;
  /** The tempo read from the kick and bass alone (under about 260 Hz). */
  lowBpm: number | null;
  /**
   * Whether to use it: the full-band and low-band readings agree (allowing
   * half or double), or the full-band beat is very clear. On 183 songs with
   * GetSongBPM tempos this kept 81% and got 83% right allowing half/double
   * (scripts/music/tune-tempo.ts).
   */
  trusted: boolean;
  /** 0..1, rough perceived intensity; only meaningful relative to other songs. */
  intensity: number;
  loudness: number;
  seconds: number;
};

let decoderPromise: Promise<MPEGDecoder> | null = null;

const getDecoder = async () => {
  if (!decoderPromise) {
    decoderPromise = (async () => {
      const decoder = new MPEGDecoder();
      await decoder.ready;
      return decoder;
    })();
  }
  return decoderPromise;
};

export async function decodeMp3(bytes: Uint8Array) {
  const decoder = await getDecoder();
  await decoder.reset();
  const { channelData, samplesDecoded, sampleRate } = decoder.decode(bytes);
  if (!samplesDecoded || !channelData.length) throw new Error("Could not decode the preview");
  const mono = new Float32Array(samplesDecoded);
  for (const channel of channelData) {
    for (let i = 0; i < samplesDecoded; i += 1) mono[i] += channel[i] / channelData.length;
  }
  return { samples: mono, sampleRate };
}

/* ---------- FFT (radix 2, in place) ---------- */

const fft = (re: Float64Array, im: Float64Array) => {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len;
    const wr = Math.cos(angle);
    const wi = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k += 1) {
        const ar = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const ai = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k + len / 2] = re[i + k] - ar;
        im[i + k + len / 2] = im[i + k] - ai;
        re[i + k] += ar;
        im[i + k] += ai;
        const next = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = next;
      }
    }
  }
};

/* ---------- Onset envelope ---------- */

const FRAME = 512;
const HOP = 128;

export const onsetEnvelope = (samples: Float32Array, sampleRate: number) => {
  // Average down to roughly 11 kHz: plenty for drums and attacks.
  const factor = Math.max(1, Math.round(sampleRate / 11025));
  const rate = sampleRate / factor;
  const length = Math.floor(samples.length / factor);
  const x = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    let sum = 0;
    for (let k = 0; k < factor; k += 1) sum += samples[i * factor + k];
    x[i] = sum / factor;
  }

  const window = new Float64Array(FRAME);
  for (let i = 0; i < FRAME; i += 1) window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FRAME - 1));

  const bins = FRAME / 2;
  const frames = Math.max(0, Math.floor((length - FRAME) / HOP));
  const flux = new Float64Array(frames);
  const lowFlux = new Float64Array(frames);
  let previous = new Float64Array(bins);
  const re = new Float64Array(FRAME);
  const im = new Float64Array(FRAME);
  let energySum = 0;
  let centroidSum = 0;
  let centroidWeight = 0;

  for (let f = 0; f < frames; f += 1) {
    const start = f * HOP;
    let frameEnergy = 0;
    for (let i = 0; i < FRAME; i += 1) {
      const v = x[start + i];
      re[i] = v * window[i];
      im[i] = 0;
      frameEnergy += v * v;
    }
    energySum += frameEnergy / FRAME;
    fft(re, im);
    const current = new Float64Array(bins);
    let total = 0;
    let low = 0;
    let magSum = 0;
    let weighted = 0;
    for (let b = 1; b < bins; b += 1) {
      const mag = Math.sqrt(re[b] * re[b] + im[b] * im[b]);
      magSum += mag;
      weighted += mag * b;
      const value = Math.log1p(100 * mag);
      current[b] = value;
      const diff = value - previous[b];
      if (diff > 0) {
        total += diff;
        // Kick and bass (under about 260 Hz) carry the beat in most pop.
        if (b <= 12) low += diff;
      }
    }
    if (magSum > 0) {
      centroidSum += (weighted / magSum) * magSum;
      centroidWeight += magSum;
    }
    flux[f] = f === 0 ? 0 : total;
    lowFlux[f] = f === 0 ? 0 : low;
    previous = current;
  }

  // Remove the slow trend (about half a second) and keep only rises.
  const fps = rate / HOP;
  const half = Math.round(fps * 0.25);
  const detrend = (values: Float64Array) => {
    const out = new Float64Array(frames);
    const prefix = new Float64Array(frames + 1);
    for (let i = 0; i < frames; i += 1) prefix[i + 1] = prefix[i] + values[i];
    for (let i = 0; i < frames; i += 1) {
      const lo = Math.max(0, i - half);
      const hi = Math.min(frames, i + half + 1);
      out[i] = Math.max(0, values[i] - (prefix[hi] - prefix[lo]) / (hi - lo));
    }
    return out;
  };
  const envelope = detrend(flux);
  const lowEnvelope = detrend(lowFlux);
  let fluxMean = 0;
  for (let i = 0; i < frames; i += 1) fluxMean += flux[i];
  fluxMean /= Math.max(1, frames);

  const rms = Math.sqrt(energySum / Math.max(1, frames));
  const centroidHz = centroidWeight ? ((centroidSum / centroidWeight) * rate) / FRAME : 0;
  return { envelope, lowEnvelope, fps, rms, fluxMean, centroidHz, seconds: length / rate };
};

/* ---------- Tempo ---------- */

const MIN_BPM = 50;
const MAX_BPM = 220;
export type TempoParams = {
  /** Where the prior is centered (BPM) and how wide it is (octaves). */
  center: number;
  width: number;
  /** Weights for the autocorrelation at 2x, 4x and half the period. */
  w2: number;
  w4: number;
  wHalf: number;
  /** Choose among the top peaks by pulse-train fit (true) or autocorrelation (false). */
  byPulse: boolean;
};

export const TEMPO_PARAMS: TempoParams = { center: 118, width: 0.9, w2: 0.5, w4: 0.25, wHalf: 0.25, byPulse: false };

const autocorrelation = (envelope: Float64Array, maxLag: number) => {
  const n = envelope.length;
  let mean = 0;
  for (let i = 0; i < n; i += 1) mean += envelope[i];
  mean /= n;
  const centered = envelope.map((v) => v - mean);
  const acf = new Float64Array(maxLag + 1);
  for (let lag = 0; lag <= maxLag; lag += 1) {
    let sum = 0;
    for (let i = 0; i + lag < n; i += 1) sum += centered[i] * centered[i + lag];
    acf[lag] = sum / (n - lag);
  }
  const zero = acf[0] || 1;
  for (let lag = 0; lag <= maxLag; lag += 1) acf[lag] /= zero;
  return acf;
};

const sampleAt = (values: Float64Array, position: number) => {
  const i = Math.floor(position);
  if (i < 0 || i + 1 >= values.length) return 0;
  const t = position - i;
  return values[i] * (1 - t) + values[i + 1] * t;
};

/** How well a pulse train at this tempo lines up with the envelope, best phase. */
const pulseScore = (envelope: Float64Array, fps: number, bpm: number) => {
  const period = (60 / bpm) * fps;
  const phases = Math.max(8, Math.round(period));
  let best = 0;
  for (let p = 0; p < phases; p += 1) {
    const phase = (p / phases) * period;
    let sum = 0;
    let count = 0;
    for (let t = phase; t < envelope.length - 1; t += period) {
      sum += sampleAt(envelope, t);
      count += 1;
    }
    const score = count ? sum / count : 0;
    if (score > best) best = score;
  }
  return best;
};

/** The tempo an onset envelope implies (exported for tuning: scripts/music/tune-tempo.ts). */
export function tempoFromEnvelope(envelope: Float64Array, fps: number, params: TempoParams = TEMPO_PARAMS) {
  const maxLag = Math.ceil((60 / MIN_BPM) * fps * 4) + 2;
  const acf = autocorrelation(envelope, Math.min(maxLag, envelope.length - 1));
  const prior = (bpm: number) => {
    const octaves = Math.log2(bpm / params.center) / params.width;
    return Math.exp(-0.5 * octaves * octaves);
  };

  const scoreFor = (bpm: number) => {
    const lag = (60 / bpm) * fps;
    // The period itself plus its multiples (a real beat repeats), and a little
    // credit for the half period, so a beat with strong off-beats wins over a
    // sparse one at the same lag.
    return sampleAt(acf, lag) + params.w2 * sampleAt(acf, 2 * lag) + params.w4 * sampleAt(acf, 4 * lag) + params.wHalf * sampleAt(acf, lag / 2);
  };

  const candidates: { bpm: number; raw: number; weighted: number }[] = [];
  for (let bpm = MIN_BPM; bpm <= MAX_BPM; bpm += 0.5) {
    const raw = scoreFor(bpm);
    candidates.push({ bpm, raw, weighted: raw * prior(bpm) });
  }

  // Local peaks only, best first.
  const peaks = candidates
    .filter((c, i) => i > 0 && i < candidates.length - 1 && c.raw >= candidates[i - 1].raw && c.raw >= candidates[i + 1].raw && c.raw > 0)
    .sort((a, b) => b.weighted - a.weighted);
  if (!peaks.length) throw new Error("No beat found in the preview");

  // Refine to a tenth of a beat with the pulse train over the whole clip.
  const refine = (peak: { bpm: number; weighted: number }) => {
    let bestBpm = peak.bpm;
    let bestScore = -1;
    for (let bpm = peak.bpm - 1.5; bpm <= peak.bpm + 1.5; bpm += 0.1) {
      const score = pulseScore(envelope, fps, bpm);
      if (score > bestScore) {
        bestScore = score;
        bestBpm = bpm;
      }
    }
    return { bpm: bestBpm, pulse: bestScore, weighted: peak.weighted };
  };
  let winner = refine(peaks[0]);
  if (params.byPulse) {
    const refined = peaks.slice(0, 4).map(refine);
    winner = refined.sort((a, b) => b.pulse * prior(b.bpm) - a.pulse * prior(a.bpm))[0];
  }
  const runnerUp = peaks[1]?.weighted ?? 0;
  return { bpm: Math.round(winner.bpm * 10) / 10, confidence: runnerUp > 0 ? peaks[0].weighted / runnerUp : 2 };
}

/** A full-band beat this clear is used even when the low band disagrees. */
export const TRUST_CONFIDENCE = 1.6;

/** Same beat, allowing for half or double time (within 3 BPM). */
export const sameBeat = (a: number, b: number) => {
  const near = (x: number, y: number) => Math.abs(x - y) <= 3;
  return near(a, b) || near(a * 2, b) || near(a, b * 2);
};

export function detectTempo(samples: Float32Array, sampleRate: number): TempoResult {
  const { envelope, lowEnvelope, fps, rms, fluxMean, centroidHz, seconds } = onsetEnvelope(samples, sampleRate);
  if (envelope.length < fps * 8) throw new Error("Preview too short to read a tempo");
  const tempo = tempoFromEnvelope(envelope, fps);
  let lowBpm: number | null = null;
  try {
    lowBpm = tempoFromEnvelope(lowEnvelope, fps).bpm;
  } catch {
    lowBpm = null;
  }
  const trusted = (lowBpm !== null && sameBeat(tempo.bpm, lowBpm)) || tempo.confidence >= TRUST_CONFIDENCE;

  const loudness = 20 * Math.log10(rms + 1e-9);
  // Intensity: loud, busy and bright reads as intense. Each part is scaled to
  // a rough 0..1 over the range real previews cover.
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const intensity =
    0.45 * clamp((loudness + 30) / 22) + 0.35 * clamp(fluxMean / 140) + 0.2 * clamp((centroidHz - 600) / 1800);

  return {
    bpm: tempo.bpm,
    confidence: tempo.confidence,
    lowBpm,
    trusted,
    intensity: Math.round(intensity * 1000) / 1000,
    loudness: Math.round(loudness * 10) / 10,
    seconds: Math.round(seconds * 10) / 10
  };
}

/** Download a preview MP3 and read its tempo. */
export async function tempoFromPreview(url: string, timeoutMs = 15000): Promise<TempoResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Preview download failed (${response.status})`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const { samples, sampleRate } = await decodeMp3(bytes);
    return detectTempo(samples, sampleRate);
  } finally {
    clearTimeout(timer);
  }
}
