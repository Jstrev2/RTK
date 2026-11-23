import Link from "next/link";
import JsonLd from "@/components/json-ld";
import { SITE_URL } from "@/lib/seo";
import { marathonCount, type Gel } from "@/lib/content/fuel";
import styles from "../fuel.module.css";

export type Crumb = { name: string; path?: string };
export type FaqItem = { q: string; a: string };

/** Breadcrumb trail plus its JSON-LD, and FAQPage JSON-LD when questions are given. */
export function FuelJsonLd({ crumbs, faq }: { crumbs: Crumb[]; faq?: FaqItem[] }) {
  const graph: Record<string, unknown>[] = [
    {
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        ...(crumb.path ? { item: `${SITE_URL}${crumb.path}` } : {})
      }))
    }
  ];
  if (faq?.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a }
      }))
    });
  }
  return <JsonLd data={{ "@context": "https://schema.org", "@graph": graph }} />;
}

export function Crumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className={styles.crumbs} aria-label="Breadcrumb">
      {crumbs.map((crumb, index) => (
        <span key={crumb.name}>
          {crumb.path && index < crumbs.length - 1 ? <Link href={crumb.path}>{crumb.name}</Link> : crumb.name}
          {index < crumbs.length - 1 ? " /" : ""}
        </span>
      ))}
    </nav>
  );
}

export function Faq({ title, items }: { title: string; items: FaqItem[] }) {
  if (!items.length) return null;
  return (
    <section className={`container ${styles.block} ${styles.faq}`}>
      <h2>{title}</h2>
      {items.map((item) => (
        <div key={item.q}>
          <h3>{item.q}</h3>
          <p>{item.a}</p>
        </div>
      ))}
    </section>
  );
}

export function PlannerCta({ text }: { text: string }) {
  return (
    <div className={styles.cta}>
      <p>{text}</p>
      <Link className="btn btn-primary" href="/tools/fueling">
        Open the Fuel Planner
      </Link>
    </div>
  );
}

const mg = (value: number) => (value ? `${value}mg` : "none");

/** The standard gel table: label numbers plus the 4:00 marathon count from lib/fueling.ts. */
export function GelTable({ gels, highlight }: { gels: Gel[]; highlight?: string }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Product</th>
            <th className={styles.num}>Carbs</th>
            <th className={styles.num}>Sodium</th>
            <th className={styles.num}>Caffeine</th>
            <th className={styles.num}>Calories</th>
            <th className={styles.num}>Servings, 4:00 marathon</th>
          </tr>
        </thead>
        <tbody>
          {gels.map((gel) => (
            <tr key={gel.key} className={gel.key === highlight ? styles.better : undefined}>
              <td>
                <Link href={`/fuel/gels/${gel.key}`}>{gel.display}</Link>
                {gel.format === "chews" && !/chews/i.test(gel.display) ? " (chews)" : ""}
              </td>
              <td className={styles.num}>{gel.carbs}g</td>
              <td className={styles.num}>{mg(gel.sodiumMg)}</td>
              <td className={styles.num}>{mg(gel.caffeineMg)}</td>
              <td className={styles.num}>{gel.calories}</td>
              <td className={styles.num}>{marathonCount(gel)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
