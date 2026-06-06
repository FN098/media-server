const publicRoutes = ["/api/auth/", "/sign-in", "/sign-up"];

export function isPublic(path: string) {
  return publicRoutes.some((p) => path.startsWith(p));
}
