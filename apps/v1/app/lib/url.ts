// =====================
// URL
// =====================

export function getAbsoluteUrl(path: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const relativePath = path.startsWith("/") ? path : `/${path}`;

  if (origin) {
    return `${origin}${relativePath}`;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  return `${baseUrl}${relativePath}`;
}
