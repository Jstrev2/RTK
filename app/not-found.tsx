import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="editorial-page">
      <section className="tool-hero container">
        <span className="eyebrow">404</span>
        <h1>That page went off course.</h1>
        <p>
          The page you&apos;re looking for doesn&apos;t exist or has moved.
          One of these will get you back on route.
        </p>
        <div className="button-row">
          <Link className="btn btn-primary" href="/">Back to the homepage</Link>
          <Link className="btn btn-secondary" href="/shoes">Browse the shoe database</Link>
          <Link className="btn btn-secondary" href="/rundown">Read the Runner Guides</Link>
        </div>
      </section>
    </div>
  );
}
