import Link from "next/link";

type Props = {
  /** Optional tool-specific opening line, rendered before the standard pitch. */
  lead?: string;
};

/**
 * Cross-sell card shown at the bottom of every free tool, pointing at the
 * injury-adaptive plan — the one premium feature on the site.
 */
export default function ComebackCta({ lead }: Props) {
  return (
    <div className="card card-accent">
      <div className="stack">
        <span className="pill">This tool is free, forever</span>
        <strong>The one thing we charge for: the comeback</strong>
        <p>
          {lead ? `${lead} ` : ""}Get hurt mid-training and Runner Toolkit
          rebuilds your remaining weeks around the injury — recovery,
          cross-training, return-to-run, and an honest race-day call. Your
          race-day verdict and first rebuilt week are free.
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link className="btn btn-primary" href="/tools/training-plans#injury">
            Rebuild my plan
          </Link>
          <Link className="btn btn-ghost" href="/premium">
            See Premium
          </Link>
        </div>
      </div>
    </div>
  );
}
