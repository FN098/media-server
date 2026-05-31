// このファイルはサーバー専用

import { ServerOnlyEnvSchema } from "@/lib/env/schemas";

const serverEnv = ServerOnlyEnvSchema.parse(process.env);

export function getDatabaseUrlOrThrow(): string {
  return serverEnv.DATABASE_URL;
}

export function getBlockedExplorerPaths(): string[] {
  return serverEnv.BLOCKED_EXPLORER_PATHS ?? [];
}

export function getProtectedExplorerPaths(): string[] {
  return serverEnv.PROTECTED_EXPLORER_PATHS ?? [];
}
