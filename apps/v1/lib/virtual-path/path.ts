import pathPosix from "path/posix";

// path/posix のラッパーだが、一貫性と拡張性のために使用

export function join(...paths: string[]): string {
  return pathPosix.join(...paths);
}

export function dirname(path: string): string {
  return pathPosix.dirname(path);
}

export function sanitize(path: string): string {
  return path
    .replace(/\\/g, "/") // \ → /
    .replace(/\/+/g, "/") // // → /
    .replace(/^\/+|\/+$/g, ""); // 先頭・末尾の /
}
