// Submit every URL in the live sitemap to IndexNow (Bing and partners).
// Run after a large content change: node scripts/indexnow-submit.mjs
// Day-to-day changes are submitted automatically by /api/cron/daily.
const SITE = "https://runnertoolkit.com";
const KEY = "eaaceb07ebc326c7a6d2ae8549fd9d11";

const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urlList.length) {
  console.error("No URLs found in sitemap.");
  process.exit(1);
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList })
});
console.log(`Submitted ${urlList.length} URLs: HTTP ${response.status} ${response.statusText}`);
if (response.status !== 200 && response.status !== 202) {
  console.error(await response.text());
  process.exit(1);
}
