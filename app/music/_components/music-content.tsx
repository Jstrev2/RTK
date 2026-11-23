import Link from "next/link";
import JsonLd from "@/components/json-ld";
import { SITE_URL } from "@/lib/seo";
import { TABLE_LIMIT, energyLabel, genreLabel, spotifyUrl, workoutBySlug, type RankedSong } from "@/lib/content/music";
import type { LinkGroup, MusicPage, Paragraph } from "@/lib/content/music-pages";
import styles from "../music.module.css";

export function Prose({ paragraphs }: { paragraphs: Paragraph[] }) {
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>
          {paragraph.map((segment, i) =>
            typeof segment === "string" ? (
              segment
            ) : segment.href.startsWith("#") ? (
              <a key={i} href={segment.href}>
                {segment.text}
              </a>
            ) : (
              <Link key={i} href={segment.href}>
                {segment.text}
              </Link>
            )
          )}
        </p>
      ))}
    </>
  );
}

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            ...items.map((item, index) => ({
              "@type": "ListItem",
              position: index + 2,
              name: item.name,
              ...(index < items.length - 1 ? { item: `${SITE_URL}${item.path}` } : {})
            }))
          ]
        }}
      />
      <nav aria-label="Breadcrumb">
        <ol className={styles.crumbs}>
          <li>
            <Link href="/">Home</Link>
          </li>
          {items.map((item, index) => (
            <li key={item.path}>
              {index < items.length - 1 ? <Link href={item.path}>{item.name}</Link> : <span aria-current="page">{item.name}</span>}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

export function LinkGroups({ groups }: { groups: LinkGroup[] }) {
  return (
    <div className={styles.groups}>
      {groups.map((group) => (
        <div key={group.heading}>
          <h3>{group.heading}</h3>
          <ul className={styles.links}>
            {group.links.map((link) => (
              <li key={link.href + link.label}>
                <Link href={link.href}>
                  {link.label}
                  {link.note && <span>{link.note}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function PlaylistCta() {
  return (
    <section className={`container next-step-card ${styles.cta}`}>
      <div>
        <span className="eyebrow">Want the whole run covered?</span>
        <h2>Turn these into a playlist that builds.</h2>
        <p>
          The playlist builder picks from the same catalog and orders it for the run: an easy start, a steady middle and
          the biggest songs saved for the finish.
        </p>
      </div>
      <Link className="btn btn-primary" href="/tools/music">
        Open the playlist builder
      </Link>
    </section>
  );
}

function SongTable({ songs, showFits, artistSlugs }: { songs: RankedSong[]; showFits?: boolean; artistSlugs: Set<string> }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Song</th>
            <th scope="col">BPM</th>
            <th scope="col">Steps a minute</th>
            <th scope="col">Genre</th>
            <th scope="col">Energy</th>
            {showFits && <th scope="col">Runs</th>}
            <th scope="col">Listen</th>
          </tr>
        </thead>
        <tbody>
          {songs.map((song, index) => {
            const linkedArtist = song.artistSlugs.length === 1 && artistSlugs.has(song.artistSlugs[0]) ? song.artistSlugs[0] : null;
            return (
              <tr key={song.id}>
                <td className={styles.rank}>{index + 1}</td>
                <td className={styles.song}>
                  <strong>{song.title}</strong>
                  {linkedArtist ? <Link href={`/music/artist/${linkedArtist}`}>{song.artist}</Link> : <span>{song.artist}</span>}
                </td>
                <td>{song.bpm}</td>
                <td>
                  {song.steps === null ? (
                    <span className={styles.muted}>Off running tempo</span>
                  ) : (
                    <>
                      {song.steps}
                      {song.halfTime && <span className={styles.half}>half-time</span>}
                    </>
                  )}
                </td>
                <td>
                  {song.genres.length ? (
                    song.genres.slice(0, 2).map(genreLabel).join(", ")
                  ) : (
                    <span className={styles.muted}>Not listed</span>
                  )}
                </td>
                <td>{energyLabel(song.energy)}</td>
                {showFits && (
                  <td>
                    {song.workouts.length
                      ? song.workouts.map((slug) => workoutBySlug(slug)?.label ?? slug).join(", ")
                      : "Not tagged"}
                  </td>
                )}
                <td>
                  <a
                    className={styles.spotify}
                    href={spotifyUrl(song)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${song.spotifyId ? "Open" : "Search for"} ${song.title} by ${song.artist} in Spotify`}
                  >
                    {song.spotifyId ? "Open in Spotify" : "Find on Spotify"}
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function MusicContent({ page }: { page: MusicPage }) {
  const shown = page.songs.slice(0, TABLE_LIMIT);
  const hasHalf = shown.some((song) => song.halfTime);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: page.h1,
    url: `${SITE_URL}${page.path}`,
    numberOfItems: shown.length,
    itemListOrder: page.ascending ? "https://schema.org/ItemListOrderAscending" : "https://schema.org/ItemListOrderDescending",
    itemListElement: shown.map((song, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "MusicRecording",
        name: song.title,
        byArtist: { "@type": "MusicGroup", name: song.artist },
        ...(song.genres.length ? { genre: song.genres.map(genreLabel) } : {}),
        ...(song.spotifyId ? { url: spotifyUrl(song) } : {})
      }
    }))
  };

  return (
    <div className={styles.page}>
      <JsonLd data={itemList} />
      <section className="tool-hero container">
        <Breadcrumbs items={page.breadcrumbs} />
        <span className="eyebrow">{page.eyebrow}</span>
        <h1>{page.h1}</h1>
        <div className={styles.intro}>
          <Prose paragraphs={page.intro} />
        </div>
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="songs">
        <h2 id="songs">{page.tableHeading}</h2>
        <SongTable songs={shown} showFits={page.showFits} artistSlugs={new Set(page.artistSlugs)} />
        <p className={styles.note}>
          {page.songs.length > shown.length
            ? `Showing the top ${shown.length} of ${page.songs.length.toLocaleString("en-US")}. `
            : ""}
          {page.rankNote} {hasHalf ? ENERGY_NOTE_TEXT : ""} BPM data includes contributions from{" "}
          <a href="https://getsongbpm.com" target="_blank" rel="noopener noreferrer">
            GetSongBPM
          </a>
          .
        </p>
      </section>

      <section className={`container ${styles.section} ${styles.prose}`} id="how-to" aria-labelledby="how-to-heading">
        <h2 id="how-to-heading">{page.howTo.heading}</h2>
        <Prose paragraphs={page.howTo.paragraphs} />
      </section>

      {page.related.length > 0 && (
        <section className={`container ${styles.section}`} aria-labelledby="related-heading">
          <h2 id="related-heading">Keep browsing</h2>
          <LinkGroups groups={page.related} />
        </section>
      )}

      <PlaylistCta />
    </div>
  );
}

const ENERGY_NOTE_TEXT =
  "Energy is our catalog's label and it mostly follows each song's raw tempo, so a half-time track reads Low even when it hits hard.";
