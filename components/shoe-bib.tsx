import Link from "next/link";
import { cardLine, modelName, type ShoeCard } from "@/lib/shoe-catalog";

type Props = {
  shoe: ShoeCard;
  /** Bib number shown top left (rank). */
  number?: number;
  /** Small volt badge top right, e.g. "Top pick". */
  badge?: string;
  /** One plain sentence shown under the stats, e.g. why it matched. */
  reason?: string;
  /** Load the photo eagerly (first row). */
  eager?: boolean;
};

/** A shoe as a race bib: photo, name, two numbers, price. */
export default function ShoeBib({ shoe, number, badge, reason, eager }: Props) {
  return (
    <Link href={`/shoes/${shoe.id}`} className="bib shoe-bib">
      <span className="bib-pins" />
      {number !== undefined ? <span className="bib-number">{String(number).padStart(2, "0")}</span> : null}
      {badge ? <span className="bib-badge">{badge}</span> : null}
      <span className="bib-photo">
        {shoe.image ? (
          <img
            src={shoe.image}
            alt={shoe.imageAlt ?? `${shoe.name} running shoe`}
            width={900}
            height={600}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
          />
        ) : (
          <span className="bib-photo-fallback">{shoe.brand}</span>
        )}
      </span>
      <span className="bib-meta">{shoe.brand}</span>
      <span className="bib-title">{modelName(shoe)}</span>
      <span className="shoe-bib-line">{cardLine(shoe)}</span>
      <span className="bib-stats">
        {shoe.weight ? (
          <span className="split">
            <b>{shoe.weight}</b>oz
          </span>
        ) : null}
        {shoe.drop !== null ? (
          <span className="split">
            <b>{shoe.drop}</b>mm drop
          </span>
        ) : null}
        {shoe.stack ? (
          <span className="split">
            <b>{shoe.stack}</b>mm stack
          </span>
        ) : null}
      </span>
      {reason ? <span className="shoe-bib-reason">{reason}</span> : null}
      <span className="bib-tear">
        <span className="bib-price">{shoe.price ? `$${shoe.price}` : "See price"}</span>
        <span className="text-link">Details →</span>
      </span>
    </Link>
  );
}
