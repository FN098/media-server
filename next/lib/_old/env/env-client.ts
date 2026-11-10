// このファイルはクライアント専用

import { NextPublicEnvSchema } from "@/__lib/env/schemas";

const publicEnv = NextPublicEnvSchema.parse(process.env);

/** @deprecated */
export function getWebUiUrl(): string | null {
  return publicEnv.NEXT_PUBLIC_WEB_UI_URL ?? null;
}

/** @deprecated */
export function getWebUiUrlOrThrow(): string {
  const url = getWebUiUrl();
  if (!url) throw new Error("Missing env:NEXT_PUBLIC_WEB_UI_URL");
  return url;
}

/** @deprecated */
export function getWebApiUrl(): string | null {
  return publicEnv.NEXT_PUBLIC_API_URL ?? null;
}

/** @deprecated */
export function getWebApiUrlOrThrow(): string {
  const url = getWebApiUrl();
  if (!url) throw new Error("Missing env:NEXT_PUBLIC_API_URL");
  return url;
}
