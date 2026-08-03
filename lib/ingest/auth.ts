export function isAuthorized(request: Request): boolean {
  // Vercel cron invocations send "Authorization: Bearer ${CRON_SECRET}" when
  // the CRON_SECRET env var is set; cron paths cannot carry env-var secrets.
  const cronSecret = process.env.CRON_SECRET ?? "";
  const authHeader = request.headers.get("authorization") ?? "";
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

  const secret = process.env.INGEST_SECRET ?? "";
  if (!secret) return false;

  const header = request.headers.get("x-ingest-secret");
  if (header && header === secret) return true;

  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}
