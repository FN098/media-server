/** @deprecated */
export function isRootPath(path: string): boolean {
  return path === "";
}

/** @deprecated */
export function sanitize(path: string): string {
  return path
    .replace(/\\/g, "/") // \ → /
    .replace(/\/+/g, "/") // // → /
    .replace(/^\/+|\/+$/g, ""); // 先頭・末尾の / 削除
}
