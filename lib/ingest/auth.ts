export function isAuthorized(request: Request): boolean {
  // Vercel cron invocations send "Authorization: Bearer ${CRON_SECRET}" when
  // the CRON_SECRET env var is set; cron paths cannot carry env-var secrets.
  const cronSecret = process.env.CRON_SECRET ?? "";
  const authHeader = request.headers.get("authorization") ?? "";
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

  const secret = process.env.INGEST_SECRET ?? "";
  if (!secret) return false;

  // Header only. The secret used to be accepted as a ?secret= query parameter
  // too, which put it in access logs.
  const header = request.headers.get("x-ingest-secret");
  return Boolean(header) && header === secret;
}
