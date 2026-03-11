export type ImageSearchResult = {
  url: string;
  source: "bing" | "serpapi";
};

type ImageSearchParams = {
  name: string;
  brand?: string | null;
  itemType: "shoe" | "attire" | string;
};

const buildQuery = ({ name, brand, itemType }: ImageSearchParams) => {
  const suffix = itemType === "shoe" ? "running shoe" : "running apparel";
  return `${brand ? `${brand} ` : ""}${name} ${suffix}`.trim();
};

const fetchFromBing = async (query: string): Promise<ImageSearchResult | null> => {
  const apiKey = process.env.BING_IMAGE_SEARCH_KEY ?? "";
  if (!apiKey) {
    return null;
  }

  const url = `https://api.bing.microsoft.com/v7.0/images/search?q=${encodeURIComponent(
    query
  )}&safeSearch=Moderate&count=1`;

  const response = await fetch(url, {
    headers: {
      "Ocp-Apim-Subscription-Key": apiKey,
      "User-Agent": "runner-toolkit-ingest"
    }
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { value?: Array<{ contentUrl?: string }> };
  const imageUrl = data.value?.[0]?.contentUrl;
  if (!imageUrl) {
    return null;
  }

  return { url: imageUrl, source: "bing" };
};

const fetchFromSerpApi = async (query: string): Promise<ImageSearchResult | null> => {
  const apiKey = process.env.SERPAPI_API_KEY ?? "";
  if (!apiKey) {
    return null;
  }

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_images");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("safe", "active");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "runner-toolkit-ingest"
    }
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    images_results?: Array<{ original?: string; thumbnail?: string }>;
  };

  const imageUrl = data.images_results?.[0]?.original ?? data.images_results?.[0]?.thumbnail;
  if (!imageUrl) {
    return null;
  }

  return { url: imageUrl, source: "serpapi" };
};

export const fetchImageForItem = async (
  params: ImageSearchParams
): Promise<ImageSearchResult | null> => {
  const query = buildQuery(params);
  return (await fetchFromBing(query)) ?? (await fetchFromSerpApi(query));
};
