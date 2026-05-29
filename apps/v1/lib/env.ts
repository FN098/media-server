export function getPublicSiteUrl(): string | null {
  return process.env.NEXT_PUBLIC_SITE_URL ?? null;
}

export function getDatabaseUrlOrThrow(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("env:DATABASE_URL is invalid");
  return databaseUrl;
}
