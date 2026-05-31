// このファイルはクライアント専用

import { NextPublicEnvSchema } from "@/lib/env/schemas";

const publicEnv = NextPublicEnvSchema.parse(process.env);

export function getWebUiUrl(): string | null {
  return publicEnv.NEXT_PUBLIC_WEB_UI_URL ?? null;
}

export function getWebApiUrl(): string | null {
  return publicEnv.NEXT_PUBLIC_WEB_API_URL ?? null;
}
