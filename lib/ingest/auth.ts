export function isAuthorized(request: Request): boolean {
  const secret = process.env.INGEST_SECRET ?? "";
  if (!secret) return false;

  const header = request.headers.get("x-ingest-secret");
  if (header && header === secret) return true;

  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}
