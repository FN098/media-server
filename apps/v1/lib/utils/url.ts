import { URL } from "url";

export function getAbsoluteUrl(baseUrl: string | null, path: string): string {
  const relativePath = path.startsWith("/") ? path : `/${path}`;

  if (baseUrl) return `${baseUrl}${relativePath}`;

  if (typeof window !== "undefined") {
    return `${window.location.origin}${relativePath}`;
  }

  throw new Error("Cannot resolve absolute URL: no baseUrl and no window");
}

export type ParsedDatabaseURL = {
  protocol: string;
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
};

const defaultPortMap: Record<string, string> = {
  mysql: "3306",
  postgresql: "5432",
};

export function parseDatabaseURL(databaseUrl: string): ParsedDatabaseURL {
  const url = new URL(databaseUrl);

  const protocol = url.protocol.replace(":", "");
  const user = url.username;
  const password = url.password;
  const host = url.hostname;
  const port = url.port !== "" ? url.port : (defaultPortMap[protocol] ?? "");
  const database = url.pathname.split("/").filter(Boolean)[0] ?? "";

  return {
    protocol,
    host,
    port,
    user,
    password,
    database,
  };
}
