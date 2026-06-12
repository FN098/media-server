import pathPrimitive from "path";

export function join(...paths: string[]): string {
  const result = pathPrimitive.join(...paths);
  return result === "." ? "" : result;
}

export function dirname(path: string): string {
  return pathPrimitive.dirname(path);
}

export function basename(path: string, suffix?: string): string {
  return pathPrimitive.basename(path, suffix);
}

export function extname(path: string): string {
  return pathPrimitive.extname(path);
}

export function parentpath(path: string): string | null {
  if (path === "") return null;
  return path.split("/").slice(0, -1).join("/");
}
