"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase-client";

export type CatalogItem = {
  item_type: string;
  item_key: string;
  name: string;
  brand: string | null;
  category: string | null;
  release_year: string | null;
  image_url: string | null;
  mention_count: number | null;
  mention_score: number | null;
  last_seen: string | null;
};

type CatalogHook = {
  items: CatalogItem[];
  loading: boolean;
  available: boolean;
};

type CatalogOptions = {
  limit?: number;
  orderBy?: "mention_score" | "release_year" | "updated_at";
};

export const useCatalogItems = (
  itemType: "shoe" | "attire",
  options: CatalogOptions = {}
): CatalogHook => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    const limit = options.limit ?? 12;
    const orderBy = options.orderBy ?? "release_year";

    supabase
      .from("catalog_items")
      .select(
        "item_type,item_key,name,brand,category,release_year,image_url,mention_count,mention_score,last_seen"
      )
      .eq("item_type", itemType)
      .order(orderBy, { ascending: false, nullsFirst: false })
      .order("mention_score", { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        if (!active) {
          return;
        }
        setItems((data as CatalogItem[]) ?? []);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [itemType, options.limit, options.orderBy]);

  return { items, loading, available: Boolean(getSupabaseClient()) };
};
