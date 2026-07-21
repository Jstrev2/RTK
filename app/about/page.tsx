import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Runner Toolkit",
  description: "Runner Toolkit builds practical, explainable tools for the decisions runners make around every run."
};

export default function AboutPage() {
  return (
    <div className="editorial-page">
      <section className="tool-hero container">
        <span className="eyebrow">About Runner Toolkit</span>
        <h1>Running creates enough hard decisions. The small ones should be easier.</h1>
        <p>
          Runner Toolkit exists to turn shoe research, playlist hunting, fuel
          math, and disrupted training plans into clear next steps.
        </p>
      </section>
      <section className="section container prose-block">
        <h2 className="section-title">Run smarter. Guess less.</h2>
        <p>
          The free tools are the product—not a trial. They help a runner choose
          shoes, music, fuel, pace, and a starting training plan. Runner Toolkit
          earns money through clearly disclosed shoe and fuel links and through
          Adaptive Training when a schedule needs continued revision.
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
