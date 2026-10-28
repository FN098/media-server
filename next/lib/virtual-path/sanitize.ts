export function sanitizeVirtualPath(path: string): string {
  return path
    .replace(/\\/g, "/") // \ → /
    .replace(/\/+/g, "/") // // → /
    .replace(/^\/+|\/+$/g, ""); // 先頭・末尾の / 削除
}
