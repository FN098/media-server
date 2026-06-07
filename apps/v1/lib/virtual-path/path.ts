import pathPosix from "path/posix";

// path/posix のラッパーだが、一貫性と将来の拡張性のために使用を推奨

export function join(...paths: string[]): string {
  const result = pathPosix.join(...paths);
  return result === "." ? "" : result;
}

export function dirname(path: string): string {
  return pathPosix.dirname(path);
}

export function basename(path: string, suffix?: string): string {
  return pathPosix.basename(path, suffix);
}

export function extname(path: string): string {
  return pathPosix.extname(path);
}

export function sanitize(path: string): string {
  return path
    .replace(/\\/g, "/") // \ → /
    .replace(/\/+/g, "/") // // → /
    .replace(/^\/+|\/+$/g, ""); // 先頭・末尾の / 削除
}
