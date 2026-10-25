import path from "node:path";

export function getAbsoluteUrl(baseUrl: string | null, path: string): string {
  const relativePath = path.startsWith("/") ? path : `/${path}`;

  if (baseUrl) return `${baseUrl}${relativePath}`;

  if (typeof window !== "undefined") {
    return `${window.location.origin}${relativePath}`;
  }

  throw new Error("Cannot resolve absolute URL: no baseUrl and no window");
}

export function joinUrlPath(...parts: string[]): string {
  return path.join(...parts).replace(/\\/g, "/");
}
