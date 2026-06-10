const publicRoutes = ["/api/auth/", "/sign-in", "/sign-up"];

export function isPublicRoute(path: string) {
  return publicRoutes.some((p) => path.startsWith(p));
}
