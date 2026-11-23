import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About Runner Toolkit",
  description: "Runner Toolkit builds practical, explainable tools for the decisions runners make around every run.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="editorial-page">
      <section className="tool-hero container">
        <span className="eyebrow">About Runner Toolkit</span>
        <h1>Running creates enough hard decisions. The small ones should be easier.</h1>
        <p>
          Runner Toolkit exists to turn shoe research, playlist hunting and fuel
          math into clear next steps.
        </p>
      </section>
      <section className="section container prose-block">
        <h2 className="section-title">Run smarter. Guess less.</h2>
        <p>
          Everything here is free and open, no account needed. A free account
          only keeps what you save.
          Runner Toolkit earns money only through clearly disclosed shoe and
          fuel links, and those links never decide what gets recommended.
        </p>
        <p>
          We are building for committed recreational runners: people training
          for real goals without a personal coach, who want a useful answer
          faster than they can get from review lists, forums, and spreadsheets.
        </p>
        <div className="button-row">
          <Link className="btn btn-primary" href="/#tools">Use the free tools</Link>
          <a className="btn btn-secondary" href="mailto:hello@runnertoolkit.com">Contact us</a>
        </div>
      </section>
    </div>
  );
}
