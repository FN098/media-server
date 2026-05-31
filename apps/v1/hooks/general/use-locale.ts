import { useMemo } from "react";

type DetectLocaleOptions = {
  headers?: Headers;
  fallback?: string;
};

function detectLocale(options: DetectLocaleOptions = {}): string {
  const { headers, fallback = "ja-JP" } = options;

  // 1. SSR（Accept-Language）
  const acceptLanguage = headers?.get("accept-language");
  if (acceptLanguage) {
    const first = acceptLanguage.split(",")[0]?.trim();
    return normalizeLocale(first) || fallback;
  }

  // 2. ブラウザ（CSR）
  if (typeof navigator !== "undefined" && navigator.language) {
    return normalizeLocale(navigator.language) || fallback;
  }

  // 3. 最終フォールバック
  return fallback;
}

function normalizeLocale(locale: string): string {
  // "en-US,en;q=0.9" みたいなのを安全にする
  return locale.split(";")[0].trim();
}

export function useLocale() {
  const locale = useMemo(() => detectLocale(), []);

  return { locale };
}
