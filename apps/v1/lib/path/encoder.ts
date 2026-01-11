export function encodePath(path: string) {
  const [pathname, query = ""] = path.split("?");
  const encodedPath = pathname.split("/").map(encodeURIComponent).join("/");

  return query ? `${encodedPath}?${query}` : encodedPath;
}
