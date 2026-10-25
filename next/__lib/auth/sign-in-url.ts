export function buildSignInUrl({ headers }: { headers: Headers }): string {
  // Middleware で注入したパスを取得（なければトップへ）
  const pathname = headers.get("x-pathname") || "/";
  const search = headers.get("x-search") || "";

  const searchParams = new URLSearchParams();

  const host = headers.get("host") || "";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const redirectTo = `${protocol}://${host}${pathname}${search}`;
  searchParams.set("redirectTo", redirectTo);

  const query = searchParams.toString();
  return query ? `/sign-in?${query}` : "/sign-in";
}
