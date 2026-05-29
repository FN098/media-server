import { URL } from "url";

export type ParsedDatabaseURL = {
  protocol: string;
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
};
const defaultPorts: Record<string, string> = {
  mysql: "3306",
  postgresql: "5432",
};

export function parseDatabaseURL(databaseUrl: string): ParsedDatabaseURL {
  const url = new URL(databaseUrl);

  const protocol = url.protocol.replace(":", "");
  const user = url.username;
  const password = url.password;
  const host = url.hostname;
  const port = url.port !== "" ? url.port : (defaultPorts[protocol] ?? "");
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
