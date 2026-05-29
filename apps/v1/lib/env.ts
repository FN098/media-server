export function getPublicSiteUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) throw new Error("env:NEXT_PUBLIC_SITE_URL is invalid");
  return siteUrl;
}

export function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("env:DATABASE_URL is invalid");
  return databaseUrl;
}
