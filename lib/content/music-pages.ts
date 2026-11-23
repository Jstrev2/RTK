import {
  GENRE_RANGES,
  MIN_SONGS,
  PACES,
  WORKOUTS,
  fmt,
  genreLabel,
  getMusicCatalog,
  getMusicIndex,
  listWords,
  median,
  paceForSteps,
  plural,
  rangeSlug,
  songName,
  songsForArtist,
  songsForBpm,
  songsForGenre,
  songsForWorkout,
  songsInStepWindow,
  stepRate,
  topGenres,
  workoutBySlug,
  type MusicIndex,
  type RankedSong,
  type WorkoutInfo
} from "@/lib/content/music";

/*
 * Page models for the /music content pages. Every sentence that carries a
 * number is written from the live catalog; the advice paragraphs are written
 * per cadence band or workout so neighbouring pages don't read the same.
 */

export type Segment = string | { href: string; text: string };
export type Paragraph = Segment[];
export type LinkItem = { href: string; label: string; note?: string };
export type LinkGroup = { heading: string; links: LinkItem[] };

export type MusicPage = {
  path: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  intro: Paragraph[];
  tableHeading: string;
  songs: RankedSong[];
  rankNote: string;
  showFits?: boolean;
  /** True when the table is sorted low to high (by BPM) rather than best first. */
  ascending?: boolean;
  howTo: { heading: string; paragraphs: Paragraph[] };
  related: LinkGroup[];
  breadcrumbs: { name: string; path: string }[];
  artistSlugs: string[];
};

const HUB = { name: "Running music", path: "/music" };

const workoutLinkLabel = (w: WorkoutInfo) => (w.slug === "intervals" ? "Interval songs" : `${w.label} songs`);

const WORKOUT_PHRASE: Record<string, string> = {
  "warm-up": "a warm-up jog",
  "easy-run": "an easy run",
  "long-run": "a long run",
  "tempo-run": "a tempo run",
  intervals: "interval reps",
  "finish-kick": "a finishing kick"
};

const bpmHref = (bpm: number) => `/music/bpm/${bpm}`;
const paceHref = (slug: string) => `/music/pace/${slug}`;
const genreHref = (slug: string) => `/music/genre/${slug}`;
const workoutHref = (slug: string) => `/music/workout/${slug}`;
const artistHref = (slug: string) => `/music/artist/${slug}`;

const TIE_NOTE =
  "Ties go to songs with net votes in our catalog (only a handful have any), then to artists who turn up most in the Spotify running-song searches the catalog was seeded from.";

const splitByTime = (songs: RankedSong[]) => ({
  direct: songs.filter((song) => !song.halfTime && song.steps !== null),
  half: songs.filter((song) => song.halfTime)
});

const standouts = (songs: RankedSong[], count = 3) => listWords(songs.slice(0, count).map(songName));

const genreSentence = (songs: RankedSong[]) => {
  const genres = topGenres(songs);
  if (!genres.length) return "";
  const [first, ...rest] = genres;
  const lower = (label: string) => (label === "R&B" ? label : label.toLowerCase());
  if (!rest.length) return `${first.label} is the only genre tagged here, on ${plural(first.count, "song")}.`;
  return `${first.label} leads the genres with ${first.count}, then ${listWords(
    rest.map((genre) => `${lower(genre.label)} (${genre.count})`)
  )}.`;
};

const bpmList = (values: number[]) => {
  const unique = [...new Set(values)].sort((a, b) => a - b);
  if (unique.length <= 2) return unique.join(" and ");
  return `${unique[0]} to ${unique[unique.length - 1]}`;
};

/* ---------- Cadence bands: advice that changes with the step rate ---------- */

const band = (steps: number) => {
  if (steps < 155) {
    return {
      heading: "Under 155 is run-walk and recovery territory",
      advice:
        "Cadence this low usually goes with a slow, floaty jog or with walk breaks. These songs suit recovery days and the running half of a run-walk plan, where the whole point is staying relaxed."
    };
  }
  if (steps < 165) {
    return {
      heading: "The high 150s and low 160s are where a lot of easy days sit",
      advice:
        "If you've never counted your steps, there's a fair chance your easy runs land here. A beat at this tempo keeps the effort conversational without letting your stride get long and lazy."
    };
  }
  if (steps < 175) {
    return {
      heading: "The high 160s and low 170s are where steady running settles",
      advice:
        "Plenty of runners drift into this range at a comfortable steady pace without trying. The beat earns its keep in the middle miles, when form slips first and a metronome in your ears holds it together."
    };
  }
  if (steps < 185) {
    return {
      heading: "Past 175, the beat is pacing you through tempo and race efforts",
      advice:
        "Most people only climb past 175 when they speed up: tempo runs, race pace, the last mile of a progression. A song here works as a turnover check, and you'll feel yourself falling off the beat before your watch says you've slowed."
    };
  }
  return {
    heading: "Above 185, save these for strides and short fast reps",
    advice:
      "Step rates this high come with real speed: strides, track reps, a hill sprint. A song lasts about as long as a long rep, so line them up with the work and give the recoveries something slower."
  };
};

const SYNC_TIP =
  "Lock in over the first 20 or 30 steps by landing on the kick drum, then stop thinking about it and let the song carry you.";

const HALF_TIME_TIP =
  "On the half-time tracks you take two steps per beat: one on it, one in the gap. If the in-between step feels vague, follow the hi-hat instead of the kick.";

const COUNT_TIP: Paragraph = [
  "Not sure of your own number? Run 30 seconds at your usual pace, count every time your right foot lands, and multiply by 4."
];

const nearestQualifying = (index: MusicIndex, target: number, exclude: number[] = []) => {
  let best: number | null = null;
  for (const entry of index.bpms) {
    if (exclude.includes(entry.bpm)) continue;
    if (best === null || Math.abs(entry.bpm - target) < Math.abs(best - target)) best = entry.bpm;
  }
  return best;
};

/* ---------- /music/bpm/[bpm] ---------- */

export const getBpmPage = async (raw: string): Promise<MusicPage | null> => {
  if (!/^\d{3}$/.test(raw)) return null;
  const target = Number(raw);
  const [catalog, index] = await Promise.all([getMusicCatalog(), getMusicIndex()]);
  if (!index.bpms.some((entry) => entry.bpm === target)) return null;

  const songs = songsForBpm(catalog.songs, target);
  if (songs.length < MIN_SONGS) return null;
  const { direct, half } = splitByTime(songs);
  const halfBpms = bpmList(half.map((song) => song.bpm));
  const odd = target % 2 === 1;

  const intro: Paragraph[] = [];
  if (direct.length && half.length) {
    intro.push([
      `${plural(songs.length, "song")} here line up with ${target} steps a minute. ${plural(direct.length, "song")} ${
        direct.length === 1 ? "sits" : "sit"
      } right at ${target} BPM, one footstrike per beat. The other ${fmt(half.length)} run at ${halfBpms} BPM, half-time${
        odd ? ", which doubles to within one step of " + target : ""
      }.`
    ]);
  } else if (half.length) {
    intro.push([
      `Nothing in our catalog sits exactly at ${target} BPM, but ${plural(half.length, "half-time track")} at ${halfBpms} BPM ${
        odd ? "double to within one step of it" : "double to it exactly"
      }: one step on each beat, one in the gap.`
    ]);
  } else {
    intro.push([`${plural(direct.length, "song")} in our catalog sit right at ${target} BPM, one footstrike per beat.`]);
  }

  const genreLine = genreSentence(songs);
  intro.push([`${genreLine ? genreLine + " " : ""}The list opens with ${standouts(songs)}.`]);

  const pace = paceForSteps(target);
  if (pace) {
    intro.push([
      `On our rough pace model, ${target} steps a minute is what a typical recreational runner takes at about ${pace.mile} a mile (${pace.km} per km). Shorter runners reach it at slower paces and taller runners need to go faster, so treat the pace as a hint and `,
      { href: "#how-to", text: "check your own step count" },
      "."
    ]);
  } else if (target < 160) {
    intro.push([
      `${target} is slower than our pace model gives for even a 13:00 mile, so these fit slow jogging, run-walk plans and the first minutes of a warm-up.`
    ]);
  } else {
    intro.push([
      `Our pace model only reaches ${target} steps a minute at well under 6:00 a mile. For most runners it shows up during strides, track reps and hill sprints, when turnover jumps.`
    ]);
  }

  const advice = band(target);
  const lower = nearestQualifying(
    index,
    Math.round(target * 0.97),
    index.bpms.filter((entry) => entry.bpm >= target).map((entry) => entry.bpm)
  );
  const howTo: Paragraph[] = [[advice.advice], [SYNC_TIP + (half.length ? " " + HALF_TIME_TIP : "")]];
  if (lower) {
    howTo.push([
      `If ${target} feels like scurrying, step down to the `,
      { href: bpmHref(lower), text: `${lower} BPM list` },
      " and work up from there. Small jumps are the useful ones: in a 2011 study by Heiderscheit and colleagues, a 5% bump in step rate was enough to cut the load at the knee."
    ]);
  }

  const neighbours = index.bpms
    .filter((entry) => entry.bpm !== target && Math.abs(entry.bpm - target) <= 5)
    .map((entry) => ({ href: bpmHref(entry.bpm), label: `${entry.bpm} BPM`, note: plural(entry.count, "song") }));
  const paces = index.paces
    .filter((p) => target >= p.low && target <= p.high)
    .map((p) => ({ href: paceHref(p.slug), label: p.label, note: `${p.low} to ${p.high} steps` }));
  const genreRanges = index.genres.flatMap((genre) =>
    genre.ranges
      .filter((r) => target >= r.range[0] && target <= r.range[1])
      .map((r) => ({
        href: `${genreHref(genre.slug)}/${r.slug}`,
        label: `${genre.label}, ${r.range[0]} to ${r.range[1]}`,
        note: plural(r.count, "song")
      }))
  );
  const workouts = index.workouts
    .filter((w) => target >= w.low && target <= w.high)
    .map((w) => ({ href: workoutHref(w.slug), label: workoutLinkLabel(w), note: plural(w.count, "song") }));

  return {
    path: bpmHref(target),
    metaTitle: `${target} BPM Running Songs for ${target} Steps a Minute`,
    metaDescription: `${plural(songs.length, "song")} that sync with ${target} steps a minute${
      direct.length && half.length ? `: ${direct.length} at ${target} BPM and ${half.length} half-time at ${halfBpms}` : ""
    }. BPM, genre, energy and a Spotify link for each.`,
    eyebrow: "Running music by BPM",
    h1: `${target} BPM running songs`,
    intro,
    tableHeading: `Songs for ${target} steps a minute`,
    songs,
    rankNote: `Order: songs on the beat first, then half-time ones. Within each group, higher energy comes first. ${TIE_NOTE}`,
    howTo: { heading: advice.heading, paragraphs: howTo },
    related: [
      { heading: "Nearby step rates", links: neighbours },
      { heading: "Paces that usually land here", links: paces },
      { heading: "By genre at this tempo", links: genreRanges },
      { heading: "Runs this cadence suits", links: workouts }
    ].filter((group) => group.links.length),
    breadcrumbs: [HUB, { name: "By BPM", path: "/music#bpm" }, { name: `${target} BPM`, path: bpmHref(target) }],
    artistSlugs: index.artists.map((a) => a.slug)
  };
};

/* ---------- /music/pace/[pace] ---------- */

export const getPacePage = async (slug: string): Promise<MusicPage | null> => {
  const pace = PACES.find((p) => p.slug === slug);
  if (!pace) return null;
  const [catalog, index] = await Promise.all([getMusicCatalog(), getMusicIndex()]);
  if (!index.paces.some((p) => p.slug === slug)) return null;

  const songs = songsInStepWindow(catalog.songs, pace.low, pace.high, pace.center);
  if (songs.length < MIN_SONGS) return null;
  const { direct, half } = splitByTime(songs);
  const exact = songs.filter((song) => song.steps === pace.center).length;

  const intro: Paragraph[] = [
    [
      `At ${pace.label} (${pace.otherLabel}), a typical recreational runner takes somewhere around ${pace.low} to ${pace.high} steps a minute. We have ${plural(
        songs.length,
        "song"
      )} whose beat lands in that window: ${fmt(direct.length)} on the beat and ${fmt(half.length)} at half-time.`
    ],
    [
      `That window is our rule of thumb, not a measurement of you. We assume about 162 steps a minute at 10:00 a mile, climbing roughly 2 steps for every 1 km/h faster, with 6 either side for height and stride. Taller runners tend to sit lower than this and shorter runners higher.`
    ],
    [
      `${genreSentence(songs)} Songs closest to ${pace.center} steps come first${
        exact ? ` (${fmt(exact)} hit it dead on)` : ""
      }, starting with ${standouts(songs)}.`.trim()
    ]
  ];

  const below = nearestQualifying(index, pace.low - 2, [pace.center]);
  const above = nearestQualifying(index, pace.high + 2, [pace.center]);
  const fast = pace.unit === "mile" ? pace.seconds <= 480 : pace.seconds <= 300;
  const howTo: Paragraph[] = [
    [
      `Run 30 seconds at ${pace.label}, count every time your right foot lands, and multiply by 4. That number beats any table, ours included.`
    ],
    below && above
      ? [
          `If you land near ${pace.center}, the list above is yours as it stands. If you come out at ${below} or ${above}, go to the `,
          { href: bpmHref(below), text: `${below} BPM` },
          " or ",
          { href: bpmHref(above), text: `${above} BPM` },
          " list instead and you'll get songs that match you exactly."
        ]
      : [`If you land near ${pace.center}, the list above is yours as it stands.`],
    [
      fast
        ? "At this speed a beat that's 5 steps slow is easy to feel; it drags. Stay close to your own number and skip any song that makes you fight it."
        : "At this pace a song a few steps off still feels fine, so pick by mood first. The beat starts to matter when you speed up."
    ]
  ];

  const sameUnit = index.paces.filter((p) => p.unit === pace.unit);
  const position = sameUnit.findIndex((p) => p.slug === slug);
  const neighbours = sameUnit
    .filter((_, i) => i !== position && Math.abs(i - position) <= 2)
    .map((p) => ({ href: paceHref(p.slug), label: p.label, note: `${p.low} to ${p.high} steps` }));
  const otherUnit = index.paces
    .filter((p) => p.unit !== pace.unit)
    .sort((a, b) => Math.abs(a.center - pace.center) - Math.abs(b.center - pace.center))
    .slice(0, 2)
    .map((p) => ({ href: paceHref(p.slug), label: p.label, note: `${p.low} to ${p.high} steps` }));
  const bpms = index.bpms
    .filter((entry) => entry.bpm >= pace.low && entry.bpm <= pace.high)
    .map((entry) => ({ href: bpmHref(entry.bpm), label: `${entry.bpm} BPM`, note: plural(entry.count, "song") }));
  const workouts = index.workouts
    .filter((w) => w.low <= pace.high && w.high >= pace.low && w.slug !== "warm-up")
    .map((w) => ({ href: workoutHref(w.slug), label: workoutLinkLabel(w), note: plural(w.count, "song") }));

  const unitWord = pace.unit === "mile" ? "Mile" : "Km";
  return {
    path: paceHref(slug),
    metaTitle: `Running Songs for a ${pace.label.replace(" a mile", "").replace(" per km", "")} ${unitWord} Pace`,
    metaDescription: `${plural(songs.length, "song")} matched to the ${pace.low} to ${pace.high} steps a minute most runners take at ${pace.label} (${pace.otherLabel}), with half-time matches and Spotify links.`,
    eyebrow: "Running music by pace",
    h1: `Running songs for ${pace.label}`,
    intro,
    tableHeading: `Songs for ${pace.low} to ${pace.high} steps a minute`,
    songs,
    rankNote: `Order: closest to ${pace.center} steps a minute first, on-the-beat songs ahead of half-time ones at the same step rate. ${TIE_NOTE}`,
    howTo: { heading: "Count your own steps before you trust this page", paragraphs: howTo },
    related: [
      { heading: "Nearby paces", links: [...neighbours, ...otherUnit] },
      { heading: "Exact step rates in this window", links: bpms },
      { heading: "Runs at this kind of cadence", links: workouts }
    ].filter((group) => group.links.length),
    breadcrumbs: [HUB, { name: "By pace", path: "/music#pace" }, { name: pace.label, path: paceHref(slug) }],
    artistSlugs: index.artists.map((a) => a.slug)
  };
};

/* ---------- /music/genre/[genre] ---------- */

const GENRE_NOTES: Record<string, string> = {
  "hip-hop":
    "A lot of hip-hop sits between 80 and 100 BPM, too slow to run on beat for beat but just right doubled: that's 160 to 200 steps a minute, with one step on the beat and one on the backbeat.",
  electronic:
    "A lot of dance music sits around 120 to 130 BPM, right in the gap below running cadence, so what's here is the slice that runs faster than that or slow enough to double.",
  classical:
    "Classical tempos drift within a piece, so the BPM is an average. Treat these as background for easy days rather than a metronome."
};

export const getGenrePage = async (slug: string): Promise<MusicPage | null> => {
  const [catalog, index] = await Promise.all([getMusicCatalog(), getMusicIndex()]);
  const entry = index.genres.find((genre) => genre.slug === slug);
  if (!entry) return null;

  const songs = songsForGenre(catalog.songs, slug);
  if (songs.length < MIN_SONGS) return null;
  const label = genreLabel(slug);
  const lower = label === "R&B" ? "R&B" : label.toLowerCase();
  const all = catalog.songs.filter((song) => song.genres.includes(slug));
  const off = all.length - songs.length;
  const gap = all.filter((song) => song.bpm > 100 && song.bpm < 140).length;
  const { direct, half } = splitByTime(songs);
  const biggest = [...entry.ranges].sort((a, b) => b.count - a.count)[0];

  const intro: Paragraph[] = [
    [
      `We have ${plural(all.length, `${lower} song`)} with a measured BPM. ${fmt(songs.length)} of them line up with a running step rate between 140 and 200, on the beat or at half-time, and those are the ones on this page.${
        off
          ? ` The other ${fmt(off)} don't match a step${gap ? `, ${fmt(gap)} of them stuck between 101 and 139 BPM, too fast to double and too slow to run on` : ""}.`
          : ""
      }`
    ],
    [
      `${fmt(direct.length)} play on the beat and ${fmt(half.length)} at half-time.${
        biggest ? ` The biggest cluster is ${biggest.range[0]} to ${biggest.range[1]} steps a minute, with ${plural(biggest.count, "song")}.` : ""
      } Top of the list: ${standouts(songs)}.`
    ]
  ];
  if (GENRE_NOTES[slug]) intro.push([GENRE_NOTES[slug]]);

  const rangeLinks: Segment[] = [];
  entry.ranges.forEach((r, i) => {
    if (i > 0) rangeLinks.push(i === entry.ranges.length - 1 ? " and " : ", ");
    rangeLinks.push({ href: `${genreHref(slug)}/${r.slug}`, text: `${r.range[0]} to ${r.range[1]}` });
    rangeLinks.push(` (${r.count})`);
  });

  const howTo: Paragraph[] = [];
  if (entry.ranges.length) {
    howTo.push([`Your step rate narrows this list faster than any subgenre will. The ${lower} songs split into `, ...rangeLinks, " steps a minute."]);
  }
  howTo.push(COUNT_TIP);
  if (half.length > direct.length) {
    howTo.push([`Most ${lower} songs here are half-time. ${HALF_TIME_TIP}`]);
  } else {
    howTo.push([SYNC_TIP]);
  }

  const otherGenres = index.genres
    .filter((genre) => genre.slug !== slug)
    .slice(0, 12)
    .map((genre) => ({ href: genreHref(genre.slug), label: genre.label, note: plural(genre.count, "song") }));
  const workouts = index.workouts.map((w) => ({
    href: workoutHref(w.slug),
    label: workoutLinkLabel(w),
    note: plural(w.count, "song")
  }));

  return {
    path: genreHref(slug),
    metaTitle: `${label} Running Songs by BPM`,
    metaDescription: `${plural(songs.length, `${lower} song`)} that sync with a running step rate, from ${Math.min(
      ...songs.map((s) => s.steps ?? 0)
    )} to ${Math.max(...songs.map((s) => s.steps ?? 0))} steps a minute. BPM, half-time matches and a Spotify link for each.`,
    eyebrow: "Running music by genre",
    h1: `${label} running songs`,
    intro,
    tableHeading: `${label} songs that match a running cadence`,
    songs,
    rankNote: `Order: songs on the beat first, then half-time ones. Within each group, higher energy comes first. ${TIE_NOTE}`,
    howTo: { heading: "Pick your step rate first, then the song", paragraphs: howTo },
    related: [
      {
        heading: `${label} by step rate`,
        links: entry.ranges.map((r) => ({
          href: `${genreHref(slug)}/${r.slug}`,
          label: `${r.range[0]} to ${r.range[1]} BPM`,
          note: plural(r.count, "song")
        }))
      },
      { heading: "Other genres", links: otherGenres },
      { heading: "By run", links: workouts }
    ].filter((group) => group.links.length),
    breadcrumbs: [HUB, { name: "By genre", path: "/music#genre" }, { name: label, path: genreHref(slug) }],
    artistSlugs: index.artists.map((a) => a.slug)
  };
};

/* ---------- /music/genre/[genre]/[range] ---------- */

export const getGenreRangePage = async (slug: string, rangeParam: string): Promise<MusicPage | null> => {
  const range = GENRE_RANGES.find((r) => rangeSlug(r) === rangeParam);
  if (!range) return null;
  const [catalog, index] = await Promise.all([getMusicCatalog(), getMusicIndex()]);
  const entry = index.genres.find((genre) => genre.slug === slug);
  if (!entry || !entry.ranges.some((r) => r.slug === rangeParam)) return null;

  const [low, high] = range;
  const genreSongs = songsForGenre(catalog.songs, slug);
  const songs = genreSongs.filter((song) => (song.steps ?? 0) >= low && (song.steps ?? 0) <= high);
  if (songs.length < MIN_SONGS) return null;
  const label = genreLabel(slug);
  const lower = label === "R&B" ? "R&B" : label.toLowerCase();
  const { direct, half } = splitByTime(songs);
  const share = Math.round((songs.length / genreSongs.length) * 100);
  const mid = (low + high) / 2;
  const pace = paceForSteps(mid);
  const advice = band(mid);

  const parts: string[] = [];
  if (direct.length) parts.push(`${fmt(direct.length)} on the beat at ${bpmList(direct.map((s) => s.bpm))} BPM`);
  if (half.length) parts.push(`${fmt(half.length)} half-time at ${bpmList(half.map((s) => s.bpm))} BPM`);

  const intro: Paragraph[] = [
    [
      `${plural(songs.length, `${lower} song`)} line up with ${low} to ${high} steps a minute: ${listWords(parts)}. That's ${share}% of the ${lower} songs we can match to a running cadence.`
    ],
    [
      `Start with ${standouts(songs)}.${
        pace ? ` On our rough pace model, the middle of this range is what a typical runner takes at about ${pace.mile} a mile (${pace.km} per km).` : ""
      }`
    ]
  ];

  const howTo: Paragraph[] = [[advice.advice], [SYNC_TIP + (half.length ? " " + HALF_TIME_TIP : "")], COUNT_TIP];

  const sameGenre = entry.ranges
    .filter((r) => r.slug !== rangeParam)
    .map((r) => ({ href: `${genreHref(slug)}/${r.slug}`, label: `${label}, ${r.range[0]} to ${r.range[1]}`, note: plural(r.count, "song") }));
  const otherGenres = index.genres
    .filter((genre) => genre.slug !== slug)
    .flatMap((genre) =>
      genre.ranges
        .filter((r) => r.slug === rangeParam)
        .map((r) => ({ href: `${genreHref(genre.slug)}/${r.slug}`, label: genre.label, note: plural(r.count, "song") }))
    )
    .slice(0, 12);
  const bpms = index.bpms
    .filter((e) => e.bpm >= low && e.bpm <= high)
    .map((e) => ({ href: bpmHref(e.bpm), label: `${e.bpm} BPM`, note: plural(e.count, "song") }));

  return {
    path: `${genreHref(slug)}/${rangeParam}`,
    metaTitle: `${label} Running Songs at ${low} to ${high} BPM`,
    metaDescription: `${plural(songs.length, `${lower} song`)} for ${low} to ${high} steps a minute, ${
      half.length ? "half-time matches included, " : ""
    }each with BPM, energy and a Spotify link.`,
    eyebrow: `${label} running music`,
    h1: `${label} running songs at ${low} to ${high} BPM`,
    intro,
    tableHeading: `${label} songs for ${low} to ${high} steps a minute`,
    songs,
    rankNote: `Order: songs on the beat first, then half-time ones. Within each group, higher energy comes first. ${TIE_NOTE}`,
    howTo: { heading: advice.heading, paragraphs: howTo },
    related: [
      { heading: `More ${lower}`, links: [{ href: genreHref(slug), label: `All ${lower} running songs`, note: plural(genreSongs.length, "song") }, ...sameGenre] },
      { heading: `Other genres at ${low} to ${high}`, links: otherGenres },
      { heading: "Exact step rates", links: bpms }
    ].filter((group) => group.links.length),
    breadcrumbs: [
      HUB,
      { name: label, path: genreHref(slug) },
      { name: `${low} to ${high} BPM`, path: `${genreHref(slug)}/${rangeParam}` }
    ],
    artistSlugs: index.artists.map((a) => a.slug)
  };
};

/* ---------- /music/workout/[workout] ---------- */

const WORKOUT_COPY: Record<string, { title: string; heading: string; paragraphs: (w: WorkoutInfo, bpms: number[]) => Paragraph[] }> = {
  "warm-up": {
    title: "Warm-Up Songs for Running",
    heading: "Start slow and let the beat pull you up",
    paragraphs: () => [
      [
        "These are slow songs. Doubled, the ones at 70 to 80 BPM land between 140 and 160 steps a minute, about where a warm-up jog sits for most people, and they're ranked first."
      ],
      [
        "Give the warm-up 10 minutes and two or three songs, then switch to a list that matches the run itself, like ",
        { href: workoutHref("easy-run"), text: "easy run songs" },
        " or ",
        { href: workoutHref("tempo-run"), text: "tempo run songs" },
        "."
      ]
    ]
  },
  "easy-run": {
    title: "Easy Run Songs Matched to Your Cadence",
    heading: "Easy-run music should be easy to ignore",
    paragraphs: (w) => [
      [
        `The songs that match ${w.low} to ${w.high} steps a minute come first, because that's where a lot of easy runs sit. Further down are tracks in the 120s and 130s that won't sync with your feet; on a recovery day that's fine, since they're mellow enough not to push you.`
      ],
      ["If a song makes you speed up, skip it. The easy day only works if it stays easy."]
    ]
  },
  "long-run": {
    title: "Long Run Songs: Steady Tempos for Big Miles",
    heading: "On a long run, variety beats intensity",
    paragraphs: () => [
      [
        "Ninety minutes of wall-to-wall hype wears thin. Keep most of the playlist steady and hold a few favorites back for the late miles, when a beat helps your form more than your mood."
      ],
      [
        "Two hours of music is about 33 songs at an average of 3.6 minutes a track, so let the ",
        { href: "/tools/music", text: "playlist builder" },
        " assemble it instead of picking every one by hand."
      ]
    ]
  },
  "tempo-run": {
    title: "Tempo Run Songs That Hold Your Cadence",
    heading: "Use the beat to stop tempo pace from drifting",
    paragraphs: (w, bpms) => {
      const picks = [170, 176].map((target) =>
        bpms.reduce((best, bpm) => (Math.abs(bpm - target) < Math.abs(best - target) ? bpm : best), bpms[0] ?? target)
      );
      return [
      [
        "Tempo pace slides in the middle reps, right when it stops feeling fast and starts feeling hard. A song that matches your tempo cadence makes the slide obvious: you feel yourself falling off the beat before your watch catches it."
      ],
      [
        `Most tempo cadences sit somewhere between ${w.low} and ${w.high}. Count yours once at tempo pace, then pick from the matching list, like `,
        { href: bpmHref(picks[0]), text: `${picks[0]} BPM` },
        " or ",
        { href: bpmHref(picks[1]), text: `${picks[1]} BPM` },
        "."
      ]
    ];
    }
  },
  intervals: {
    title: "Interval Workout Songs for Fast Reps",
    heading: "Line up one song per rep",
    paragraphs: () => [
      [
        "A typical song runs 3 to 4 minutes, close to an 800 m or 1 km rep for a lot of runners. Start each rep on a new track and the song tells you when you're done."
      ],
      [
        "Put slower songs in the gaps so the recoveries feel like recoveries. The ",
        { href: workoutHref("warm-up"), text: "warm-up list" },
        " works for that."
      ]
    ]
  },
  "finish-kick": {
    title: "Finish Kick Songs for the Last Push",
    heading: "Save the fastest song for the last few minutes",
    paragraphs: () => [
      [
        "These are the loudest, fastest songs in the catalog. Queue one for the final 2 or 3 minutes of a race or a progression run and let it pull your turnover up."
      ],
      ["Don't burn them early. A finish song that's been playing for 20 minutes stops working."]
    ]
  }
};

export const getWorkoutPage = async (slug: string): Promise<MusicPage | null> => {
  const workout = workoutBySlug(slug);
  if (!workout) return null;
  const [catalog, index] = await Promise.all([getMusicCatalog(), getMusicIndex()]);
  if (!index.workouts.some((w) => w.slug === slug)) return null;

  const songs = songsForWorkout(catalog.songs, workout);
  if (songs.length < MIN_SONGS) return null;
  const bpms = songs.map((song) => song.bpm);
  const inBand = songs.filter((song) => song.steps !== null && song.steps >= workout.low && song.steps <= workout.high);
  const copy = WORKOUT_COPY[slug];
  const lower = workout.label.toLowerCase();
  const phrase = WORKOUT_PHRASE[slug] ?? `a ${lower}`;

  const intro: Paragraph[] = [
    [
      `${plural(songs.length, "song")} in our catalog carry the ${lower} tag. The tag comes from each song's tempo and energy, so it's a starting point rather than a verdict: these run from ${Math.min(
        ...bpms
      )} to ${Math.max(...bpms)} BPM, and half of them sit at ${median(bpms)} or below.`
    ],
    [
      `We rank the ones that line up with ${workout.low} to ${workout.high} steps a minute first, since that's where ${phrase} usually ${
        slug === "intervals" ? "sit" : "sits"
      }; ${fmt(inBand.length)} of them do. ${genreSentence(songs)} Top of the list: ${standouts(songs)}.`
    ]
  ];

  const bpmLinks = index.bpms
    .filter((e) => e.bpm >= workout.low && e.bpm <= workout.high && e.bpm % 5 === 0)
    .map((e) => ({ href: bpmHref(e.bpm), label: `${e.bpm} BPM`, note: plural(e.count, "song") }));
  const paceLinks = index.paces
    .filter((p) => p.unit === "mile" && p.center >= workout.low && p.center <= workout.high)
    .map((p) => ({ href: paceHref(p.slug), label: p.label, note: `${p.low} to ${p.high} steps` }));
  const otherWorkouts = index.workouts
    .filter((w) => w.slug !== slug)
    .map((w) => ({ href: workoutHref(w.slug), label: workoutLinkLabel(w), note: plural(w.count, "song") }));

  return {
    path: workoutHref(slug),
    metaTitle: copy.title,
    metaDescription: `${fmt(songs.length)} ${workoutLinkLabel(workout).toLowerCase()} ranked by how well they fit ${workout.low} to ${workout.high} steps a minute, with BPM, energy and a Spotify link for each.`,
    eyebrow: "Running music by workout",
    h1: workoutLinkLabel(workout),
    intro,
    tableHeading: `Best fits for ${phrase}`,
    songs,
    rankNote: `Order: songs inside ${workout.low} to ${workout.high} steps a minute first, then by how far outside it they fall, then energy closest to what ${phrase} ${slug === "intervals" ? "need" : "needs"}. ${TIE_NOTE}`,
    howTo: { heading: copy.heading, paragraphs: copy.paragraphs(workout, index.bpms.map((e) => e.bpm)) },
    related: [
      { heading: "Other runs", links: otherWorkouts },
      { heading: "Step rates for this run", links: bpmLinks },
      { heading: "Paces in this cadence range", links: paceLinks }
    ].filter((group) => group.links.length),
    breadcrumbs: [HUB, { name: "By workout", path: "/music#workout" }, { name: workout.label, path: workoutHref(slug) }],
    artistSlugs: index.artists.map((a) => a.slug)
  };
};

/* ---------- /music/artist/[artist] ---------- */

export const getArtistPage = async (slug: string): Promise<MusicPage | null> => {
  const [catalog, index] = await Promise.all([getMusicCatalog(), getMusicIndex()]);
  const artist = index.artists.find((a) => a.slug === slug);
  if (!artist) return null;

  const songs = songsForArtist(catalog.songs, slug);
  if (songs.length < MIN_SONGS) return null;
  const runnable = songs.filter((song) => song.steps !== null);
  const { direct, half } = splitByTime(songs);
  const off = songs.length - runnable.length;

  const workoutCounts = WORKOUTS.map((w) => ({
    w,
    count: songs.filter((song) => song.workouts.includes(w.slug)).length
  }))
    .filter((entry) => entry.count)
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);
  const best = [...runnable]
    .sort((a, b) => Math.abs((a.steps ?? 0) - 170) - Math.abs((b.steps ?? 0) - 170) || a.title.localeCompare(b.title))
    .slice(0, 3);

  const intro: Paragraph[] = [
    [
      `We have ${plural(songs.length, `${artist.name} song`)} with a measured BPM, from ${songs[0].bpm} to ${songs[songs.length - 1].bpm}. ${
        runnable.length
          ? `${fmt(runnable.length)} line up with a running step rate: ${fmt(direct.length)} on the beat and ${fmt(half.length)} at half-time.`
          : "None of them line up with a running step rate, so treat them as background."
      }`
    ]
  ];
  const second: string[] = [];
  if (workoutCounts.length) {
    second.push(
      `By our tags they lean toward ${listWords(
        workoutCounts.map((entry) => `${entry.w.label.toLowerCase()} (${plural(entry.count, "song")})`)
      )}.`
    );
  }
  if (best.length) {
    second.push(
      `Closest to a steady 170 steps a minute: ${listWords(best.map((song) => `"${song.title}" at ${song.steps}`))}.`
    );
  }
  if (second.length) intro.push([second.join(" ")]);
  if (off) {
    intro.push([
      `The other ${fmt(off)} sit at tempos that don't match a step. They're fine as background on an easy day or for the walk home.`
    ]);
  }

  const genres = topGenres(songs, 4);
  const bpmLinks = [...new Set(runnable.map((song) => song.steps as number))]
    .filter((steps) => index.bpms.some((e) => e.bpm === steps))
    .sort((a, b) => a - b)
    .map((steps) => ({ href: bpmHref(steps), label: `${steps} BPM`, note: "more songs at this step rate" }));
  const otherArtists = index.artists
    .filter((a) => a.slug !== slug)
    .slice(0, 12)
    .map((a) => ({ href: artistHref(a.slug), label: a.name, note: plural(a.count, "song") }));

  const exampleHalf = half[0];
  return {
    path: artistHref(slug),
    metaTitle: `${artist.name} Running Songs by BPM`,
    metaDescription: `${plural(songs.length, `${artist.name} song`)} with BPM, the step rate each one fits and the runs they suit. ${fmt(
      runnable.length
    )} line up with a running cadence.`,
    eyebrow: "Running music by artist",
    h1: `${artist.name} songs for running`,
    intro,
    tableHeading: `${artist.name} songs, slowest to fastest`,
    songs,
    showFits: true,
    ascending: true,
    rankNote:
      "Order: by BPM, slowest first. The steps column shows the cadence each song fits, on the beat or at half-time; Off running tempo means the song doesn't line up with a step, even doubled. The runs column is our catalog's tag, which follows tempo and energy.",
    howTo: {
      heading: "Read the steps column, not the BPM column",
      paragraphs: [
        exampleHalf
          ? [
              `"${exampleHalf.title}" sits at ${exampleHalf.bpm} BPM and still fits ${exampleHalf.steps} steps a minute, because you take two steps per beat. Go by the steps column and more of these songs fit a run than the BPM suggests.`
            ]
          : [`Every ${artist.name} song that fits here plays on the beat, so the BPM and the step rate are the same number.`],
        COUNT_TIP
      ]
    },
    related: [
      {
        heading: "Genres",
        links: genres.filter((g) => index.genres.some((e) => e.slug === g.slug)).map((g) => ({ href: genreHref(g.slug), label: g.label }))
      },
      { heading: "Step rates these songs fit", links: bpmLinks },
      { heading: "Other artists", links: otherArtists }
    ].filter((group) => group.links.length),
    breadcrumbs: [HUB, { name: "By artist", path: "/music#artist" }, { name: artist.name, path: artistHref(slug) }],
    artistSlugs: index.artists.map((a) => a.slug)
  };
};

/* ---------- /music hub ---------- */

export const getHubData = async () => {
  const [catalog, index] = await Promise.all([getMusicCatalog(), getMusicIndex()]);
  const runnable = catalog.songs.filter((song) => stepRate(song.bpm) !== null).length;
  const halfTime = catalog.songs.filter((song) => stepRate(song.bpm)?.halfTime).length;
  const hipHop = catalog.songs.filter((song) => song.genres.includes("hip-hop") && stepRate(song.bpm) !== null);
  const hipHopHalf = hipHop.filter((song) => stepRate(song.bpm)?.halfTime).length;
  return { catalog, index, runnable, halfTime, hipHop: hipHop.length, hipHopHalf };
};
