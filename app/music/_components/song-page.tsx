import Link from "next/link";
import JsonLd from "@/components/json-ld";
import SongGrid from "@/components/music/song-grid";
import { getMusicIndex, slugify, type MusicPageModel } from "@/lib/content/music";
import { SITE_URL } from "@/lib/seo";
import styles from "../music.module.css";

/** Every /music data page: two sentences, a button into the finder, the cover grid, related links. */
export default async function SongPage({ page }: { page: MusicPageModel }) {
  const index = await getMusicIndex();
  const pages = new Set(index.artists.map((a) => a.slug));
  const artistPages = [...new Set(page.songs.map((s) => slugify(s.a)))].filter((s) => pages.has(s));
  return (
    <main className="container">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            ...page.crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 2, name: c.name, item: `${SITE_URL}${c.path}` }))
          ]
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: page.h1,
          numberOfItems: page.songs.length,
          itemListElement: page.songs.slice(0, 20).map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: { "@type": "MusicRecording", name: s.t, byArtist: { "@type": "MusicGroup", name: s.a } }
          }))
        }}
      />
      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        <Link href="/music">Running songs</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{page.crumbs[page.crumbs.length - 1].name}</span>
      </nav>
      <header className={styles.head}>
        <span className="eyebrow">{page.eyebrow}</span>
        <h1>{page.h1}</h1>
        <p className="page-hero-sub">
          {page.lines[0]} {page.lines[1]}
        </p>
        <Link className="btn btn-flare" href={page.toolHref}>
          {page.toolLabel}
        </Link>
      </header>
      <SongGrid songs={page.songs} steps={page.steps} artistPages={artistPages} />
      <div className={styles.related}>
        {page.related
          .filter((group) => group.links.length)
          .map((group) => (
            <section key={group.heading}>
              <h2 className={styles.relatedHead}>{group.heading}</h2>
              <div className="chips">
                {group.links.map((link) => (
                  <Link key={link.href} className="chip" href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </section>
          ))}
      </div>
      <p className={styles.credit}>
        BPM from <a href="https://getsongbpm.com" target="_blank" rel="noreferrer">GetSongBPM</a> where it knows the song, otherwise read from the
        beat of the song&apos;s preview. Covers and previews from Deezer.
      </p>
    </main>
  );
}
