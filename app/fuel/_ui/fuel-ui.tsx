import Link from "next/link";
import JsonLd from "@/components/json-ld";
import { SITE_URL } from "@/lib/seo";
import type { FuelProduct } from "@/lib/fueling";
import s from "../fuel.module.css";

export type Crumb = { name: string; path?: string };

/** Breadcrumb JSON-LD (and Product JSON-LD when given). */
export function FuelJsonLd({ crumbs, product }: { crumbs: Crumb[]; product?: FuelProduct }) {
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
  if (product) {
    graph.push({
      "@type": "Product",
      name: product.display,
      brand: { "@type": "Brand", name: product.brand },
      ...(product.imageUrl ? { image: product.imageUrl } : {}),
      nutrition: {
        "@type": "NutritionInformation",
        carbohydrateContent: `${product.carbs} g`,
        sodiumContent: `${product.sodiumMg} mg`,
        calories: `${product.calories} calories`,
        ...(product.servingSize ? { servingSize: product.servingSize } : {})
      }
    });
  }
  return <JsonLd data={{ "@context": "https://schema.org", "@graph": graph }} />;
}

export function Crumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className={s.crumbs} aria-label="Breadcrumb">
      {crumbs.map((crumb, index) => (
        <span key={crumb.name}>
          {crumb.path && index < crumbs.length - 1 ? <Link href={crumb.path}>{crumb.name}</Link> : crumb.name}
          {index < crumbs.length - 1 ? " / " : ""}
        </span>
      ))}
    </nav>
  );
}
