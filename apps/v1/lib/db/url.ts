import { URL } from "url";

export function getDatabaseUrlInfo() {
  const url = new URL(process.env.DATABASE_URL!);

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
