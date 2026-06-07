import { defaultPorts } from "@/lib/db/ports";
import { ParsedDatabaseURL } from "@/lib/db/types";
import { URL } from "url";

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
