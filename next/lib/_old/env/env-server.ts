// このファイルはサーバー専用

import { ServerOnlyEnvSchema } from "@/__lib/env/schemas";

const serverEnv = ServerOnlyEnvSchema.parse(process.env);

/** @deprecated */
export function getDatabaseUrlOrThrow(): string {
  return serverEnv.DATABASE_URL;
}
