import Link from "next/link";

type Props = { lead?: string };

export default function ComebackCta({ lead }: Props) {
  return (
    <div className="card card-accent">
      <div className="stack">
        <span className="pill">Runner Toolkit Injury Rescue</span>
        <strong>Injured mid-training? We&apos;ll get you back to the start line.</strong>
        <p>
          {lead ? `${lead} ` : ""}A short symptom check, an honest verdict on
          your race, and a rebuilt week-by-week comeback schedule—for the plan
          you&apos;re already on, not just ours.
        </p>
        <div className="button-row">
          <Link className="btn btn-primary" href="/rescue">Check my race — free</Link>
          <Link className="btn btn-ghost" href="/premium">See how Rescue works</Link>
        </div>
      </div>
    </div>
  );
}
