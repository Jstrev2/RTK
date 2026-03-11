import { fetchHtml } from "./common.mjs";

const parseLocs = (xml) => {
  const urls = [];
  const regex = /<loc>([^<]+)<\/loc>/gi;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const url = match[1].trim();
    if (url) {
      urls.push(url);
    }
  }
  return urls;
};

const isXml = (url) => url.toLowerCase().endsWith(".xml");

export const fetchSitemapUrls = async (
  domain,
  { maxSitemaps = 8, maxUrls = 5000 } = {}
) => {
  const roots = [
    `https://${domain}/sitemap.xml`,
    `https://${domain}/sitemap_index.xml`
  ];

  const seenSitemaps = new Set();
  const pageUrls = new Set();
  const queue = [];

  for (const root of roots) {
    queue.push(root);
  }

  while (queue.length && seenSitemaps.size < maxSitemaps) {
    const sitemapUrl = queue.shift();
    if (seenSitemaps.has(sitemapUrl)) {
      continue;
    }
    seenSitemaps.add(sitemapUrl);

    let xml;
    try {
      xml = await fetchHtml(sitemapUrl, { timeoutMs: 20000 });
    } catch {
      continue;
    }

    const locs = parseLocs(xml);
    for (const loc of locs) {
      if (isXml(loc)) {
        if (seenSitemaps.size < maxSitemaps) {
          queue.push(loc);
        }
      } else if (pageUrls.size < maxUrls) {
        pageUrls.add(loc);
      }
    }
  }

  return Array.from(pageUrls);
};
