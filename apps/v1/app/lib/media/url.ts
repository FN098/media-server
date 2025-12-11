export function getAbsoluteUrl(filePath: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const path = filePath.startsWith("/") ? filePath : `/${filePath}`;

  if (origin) {
    return `${origin}${path}`;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  return `${baseUrl}${path}`;
}
