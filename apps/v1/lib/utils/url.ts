import { URL } from "url";

export function getAbsoluteUrl(path: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const relativePath = path.startsWith("/") ? path : `/${path}`;

  if (origin) {
    return `${origin}${relativePath}`;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  return `${baseUrl}${relativePath}`;
}

export function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("env:DATABASE_URL is invalid");
  return databaseUrl;
}

export function parseDatabaseURL(databaseUrl: string) {
  const url = new URL(databaseUrl);

  const user = url.username;
  const password = url.password;
  const host = url.hostname;
  const port = url.port || "3306";
  const database = url.pathname.replace("/", "");

  return {
    user,
    password,
    host,
    port,
    database,
  };
}
