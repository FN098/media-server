export function encodePath(path: string) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return encodedPath;
}
