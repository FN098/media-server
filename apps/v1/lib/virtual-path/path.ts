import path from "path/posix";

// ただの path/posix のラッパーだが、一貫性のために使う
export function join(...paths: string[]) {
  return path.join(...paths);
}
