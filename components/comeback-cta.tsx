import Link from "next/link";

type Props = { lead?: string };

export default function ComebackCta({ lead }: Props) {
  return (
    <div className="card card-accent">
      <div className="stack">
        <span className="pill">Runner Toolkit Adaptive Training</span>
        <strong>When the plan stops fitting, change the plan.</strong>
        <p>
          {lead ? `${lead} ` : ""}Preview how the remaining schedule can change
          when missed time or an appropriately cleared return changes what is realistic.
        </p>
        <div className="button-row">
          <Link className="btn btn-primary" href="/tools/training-plans#adapt">Try a sample adjustment</Link>
          <Link className="btn btn-ghost" href="/premium">See Adaptive Training</Link>
        </div>
      </div>
    </div>
  );
}
