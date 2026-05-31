import pathPosix from "path/posix";

// path/posix のラッパーだが、一貫性と拡張性のために使用

export function join(...paths: string[]) {
  return pathPosix.join(...paths);
}

export function dirname(path: string) {
  return pathPosix.dirname(path);
}
