import Link from "next/link";
import JsonLd from "@/components/json-ld";
import SongGrid from "@/components/music/song-grid";
import { fmt, getMusicIndex, slugify } from "@/lib/content/music";
import { coverUrl } from "@/lib/music/shared";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import MusicSearch from "./_components/music-search";
import styles from "./music.module.css";

export const revalidate = 86400;

export const metadata = pageMetadata({
  title: "Running Songs by Pace, Run and BPM",
  description:
    "Popular songs matched to your running stride. Browse by pace or the kind of run, search any song for its BPM, or build a playlist that saves to Spotify.",
  path: "/music"
});

export default async function MusicHubPage() {
  const index = await getMusicIndex();
  const artistSet = new Set(index.artists.map((a) => a.slug));
  const artistPages = [...artistSet];
  const miles = index.paces.filter((p) => p.unit === "mile");

  return (
    <main className="container">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Running songs by pace, run and BPM",
          url: `${SITE_URL}/music`,
          isPartOf: { "@type": "WebSite", name: "Runner Toolkit", url: SITE_URL }
        }}
      />
      <header className={styles.hero}>
        <span className="eyebrow">Running songs</span>
        <h1>Songs that land on your stride</h1>
        <p className="page-hero-sub">
          {fmt(index.total)} popular songs, each with a checked BPM. Pick your pace or your run, or search any song.
        </p>
        <MusicSearch total={index.total} artistPages={artistPages} />
        <p style={{ marginTop: 14 }}>
          <Link className="btn btn-flare" href="/tools/music">
            Build my playlist
          </Link>
        </p>
      </header>

      <section className={styles.section} aria-labelledby="by-pace">
        <div className="section-head">
          <h2 id="by-pace">By pace</h2>
          <span className="eyebrow">Your usual pace, a mile</span>
        </div>
        <div className={styles.paces}>
          {miles.map((p) => (
            <Link key={p.slug} href={`/music/pace/${p.slug}`} className={styles.pace}>
              <b>{p.label.replace(" a mile", "")}</b>
              <span>
                {p.center} steps · {fmt(p.count)} songs
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="by-run">
        <div className="section-head">
          <h2 id="by-run">By run</h2>
        </div>
        <div className={styles.tiles}>
          {index.workouts.map((w) => (
            <Link key={w.slug} href={`/music/workout/${w.slug}`} className={styles.tile}>
              <span className={styles.tileArt} aria-hidden="true">
                {w.covers.map((c) => (
                  <img key={c} src={coverUrl(c, 120) ?? ""} alt="" loading="lazy" />
                ))}
              </span>
              <span className={styles.tileName}>{w.label}</span>
              <span className={styles.tileNote}>
                ~{w.steps} steps · {fmt(w.count)} songs
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="popular">
        <div className="section-head">
          <h2 id="popular">Popular right now</h2>
        </div>
        <SongGrid songs={index.popular} first={12} artistPages={artistPages.filter((s) => index.popular.some((p) => slugify(p.a) === s))} />
      </section>

      <section className={styles.section} aria-labelledby="by-genre">
        <div className="section-head">
          <h2 id="by-genre">By genre</h2>
        </div>
        <div className={styles.tiles}>
          {index.genres.map((g) => (
            <Link key={g.slug} href={`/music/genre/${g.slug}`} className={styles.tile}>
              <span className={styles.tileArt} aria-hidden="true">
                {g.covers.map((c) => (
                  <img key={c} src={coverUrl(c, 120) ?? ""} alt="" loading="lazy" />
                ))}
              </span>
              <span className={styles.tileName}>{g.label}</span>
              <span className={styles.tileNote}>{fmt(g.count)} songs</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="by-bpm">
        <div className="section-head">
          <h2 id="by-bpm">By exact BPM</h2>
          <span className="eyebrow">If you&apos;ve counted your steps</span>
        </div>
        <div className={styles.bpms}>
          {index.bpms.map((b) => (
            <Link key={b.bpm} href={`/music/bpm/${b.bpm}`} className="split">
              <b>{b.bpm}</b>
            </Link>
          ))}
        </div>
      </section>

      <p className={styles.credit}>
        BPM from <a href="https://getsongbpm.com" target="_blank" rel="noreferrer">GetSongBPM</a> where it knows the song, otherwise read from the beat
        of the song&apos;s preview. Covers and previews from Deezer.
      </p>
    </main>
  );
}
