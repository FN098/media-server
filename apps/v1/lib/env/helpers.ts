export function getWebUiUrl(): string | null {
  return process.env.NEXT_PUBLIC_WEB_UI_URL ?? null;
}

export function getWebApiUrl(): string | null {
  return process.env.NEXT_PUBLIC_WEB_API_URL ?? null;
}

export function getDatabaseUrlOrThrow(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("env:DATABASE_URL is invalid");
  return databaseUrl;
}
