// このファイルはサーバー専用

import { ServerOnlyEnvSchema } from "@/lib/_old/env/schemas";

const serverEnv = ServerOnlyEnvSchema.parse(process.env);

/** @deprecated */
export function getDatabaseUrlOrThrow(): string {
  return serverEnv.DATABASE_URL;
}
