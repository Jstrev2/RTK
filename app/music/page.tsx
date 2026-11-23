import Link from "next/link";
import JsonLd from "@/components/json-ld";
import { getHubData } from "@/lib/content/music-pages";
import { KM_PACES, fmt, plural } from "@/lib/content/music";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { Breadcrumbs, LinkGroups, PlaylistCta } from "./_components/music-content";
import styles from "./music.module.css";

export const revalidate = 86400;

export const metadata = pageMetadata({
  title: "Running Songs by BPM, Pace, Genre and Workout",
  description:
    "Running songs matched to your cadence: pick a BPM, a pace, a genre or the kind of run, and get songs that line up with your steps, half-time matches included.",
  path: "/music"
});

export default async function MusicHubPage() {
  const { catalog, index, runnable, halfTime, hipHop, hipHopHalf } = await getHubData();
  const miles = index.paces.filter((pace) => pace.unit === "mile");
  const published = new Set(index.paces.map((pace) => pace.slug));
  // Most km paces share a step window with a mile pace, so they link to that page.
  const kms = KM_PACES.filter((pace) => published.has(pace.target));

  return (
    <div className={styles.page}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Running songs by BPM, pace, genre and workout",
          url: `${SITE_URL}/music`,
          isPartOf: { "@type": "WebSite", name: "Runner Toolkit", url: SITE_URL }
        }}
      />
      <section className="tool-hero container">
        <Breadcrumbs items={[{ name: "Running music", path: "/music" }]} />
        <span className="eyebrow">Running music</span>
        <h1>Running songs that match your steps</h1>
        <div className={styles.intro}>
          <p>
            Every song on these pages has a measured BPM: {fmt(catalog.songs.length)} of them. {fmt(runnable)} line up
            with a running step rate between 140 and 200 a minute, and {fmt(halfTime)} of those do it at half-time, two
            steps for every beat.
          </p>
          <p>
            Go in by whatever you already know. If you&apos;ve counted your steps, start with BPM. If you only know your
            pace, start there and we&apos;ll estimate the cadence. Otherwise pick a genre or the kind of run.
          </p>
          <p>
            The {fmt(catalog.withoutBpm)} songs in the{" "}
            <Link href="/tools/music">playlist builder</Link> that don&apos;t have a BPM yet are left out here, since
            there&apos;s no way to match them to a step.
          </p>
        </div>
      </section>

      {index.bpms.length > 0 && (
        <section className={`container ${styles.section}`} id="bpm" aria-labelledby="bpm-heading">
          <h2 id="bpm-heading">Start with your cadence</h2>
          <ul className={styles.bpmGrid}>
            {index.bpms.map((entry) => (
              <li key={entry.bpm}>
                <Link href={`/music/bpm/${entry.bpm}`}>
                  {entry.bpm} BPM
                  <span>{plural(entry.count, "song")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {index.paces.length > 0 && (
        <section className={`container ${styles.section}`} id="pace" aria-labelledby="pace-heading">
          <h2 id="pace-heading">Or start with your pace</h2>
          <p className={styles.note}>
            We estimate cadence from pace at about 162 steps a minute for a 10:00 mile, rising roughly 2 steps for every
            1 km/h faster. It&apos;s a rough average, so a quick step count of your own beats it.
          </p>
          <LinkGroups
            groups={[
              {
                heading: "Per mile",
                links: miles.map((pace) => ({
                  href: `/music/pace/${pace.slug}`,
                  label: pace.label,
                  note: `${pace.low} to ${pace.high} steps`
                }))
              },
              {
                heading: "Per kilometer",
                links: kms.map((pace) => ({
                  href: `/music/pace/${pace.target}`,
                  label: pace.label,
                  note: `${pace.low} to ${pace.high} steps`
                }))
              }
            ].filter((group) => group.links.length)}
          />
        </section>
      )}

      {index.genres.length > 0 && (
        <section className={`container ${styles.section}`} id="genre" aria-labelledby="genre-heading">
          <h2 id="genre-heading">By genre</h2>
          <LinkGroups
            groups={[
              {
                heading: "Songs that match a running cadence",
                links: index.genres.map((genre) => ({
                  href: `/music/genre/${genre.slug}`,
                  label: genre.label,
                  note: plural(genre.count, "song")
                }))
              }
            ]}
          />
        </section>
      )}

      {index.workouts.length > 0 && (
        <section className={`container ${styles.section}`} id="workout" aria-labelledby="workout-heading">
          <h2 id="workout-heading">By the run you&apos;re doing</h2>
          <LinkGroups
            groups={[
              {
                heading: "Workouts",
                links: index.workouts.map((workout) => ({
                  href: `/music/workout/${workout.slug}`,
                  label: workout.label,
                  note: `${workout.low} to ${workout.high} steps`
                }))
              }
            ]}
          />
        </section>
      )}

      {index.artists.length > 0 && (
        <section className={`container ${styles.section}`} id="artist" aria-labelledby="artist-heading">
          <h2 id="artist-heading">By artist</h2>
          <LinkGroups
            groups={[
              {
                heading: `Artists with at least 8 songs we have a BPM for`,
                links: index.artists.map((artist) => ({
                  href: `/music/artist/${artist.slug}`,
                  label: artist.name,
                  note: plural(artist.count, "song")
                }))
              }
            ]}
          />
        </section>
      )}

      <section className={`container ${styles.section} ${styles.prose}`} aria-labelledby="count-heading">
        <h2 id="count-heading">Thirty seconds of counting beats any chart</h2>
        <p>
          Run at your normal pace, count every time your right foot lands for 30 seconds, and multiply by 4. That&apos;s
          your cadence, and it&apos;s the number to pick songs by. Pace tables, ours included, are guesses about a
          runner who isn&apos;t you.
        </p>
        <p>
          Half-time songs count. A track at 85 BPM fits 170 steps a minute just as well as one at 170, you just take two
          steps per beat.
          {hipHop ? ` It's how ${fmt(hipHopHalf)} of the ${fmt(hipHop)} hip-hop songs that fit a run get here.` : ""}
        </p>
      </section>

      <PlaylistCta />
    </div>
  );
}
