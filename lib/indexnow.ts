import { SITE_URL } from "@/lib/seo";

/**
 * IndexNow tells Bing (and the engines that share its index, which includes
 * the search behind ChatGPT and Copilot) that a URL is new or changed, so it
 * gets crawled in minutes instead of whenever a crawler next wanders past.
 *
 * The key is public by design: it only proves we control the domain, via the
 * matching file at /<key>.txt in public/.
 */
export const INDEXNOW_KEY = "eaaceb07ebc326c7a6d2ae8549fd9d11";

export async function submitToIndexNow(urls: string[]): Promise<{ ok: boolean; status: number; count: number }> {
  const urlList = [...new Set(urls)].slice(0, 10000);
  if (!urlList.length) return { ok: true, status: 0, count: 0 };

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList
    })
  });
  // 200 and 202 both mean accepted.
  return { ok: response.status === 200 || response.status === 202, status: response.status, count: urlList.length };
}
