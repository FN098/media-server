// このファイルはサーバー専用

import { ServerOnlyEnvSchema } from "@/lib/env/schemas";

const serverEnv = ServerOnlyEnvSchema.parse(process.env);

export function getDatabaseUrlOrThrow(): string {
  return serverEnv.DATABASE_URL;
}
