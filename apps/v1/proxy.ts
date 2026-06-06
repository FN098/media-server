import { auth } from "@/lib/auth/better-auth";
import { isBlockedClientPath } from "@/lib/path/protections";
import { isPublic } from "@/lib/routing/public-routes";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 一般公開系のパスは素通し
  if (isPublic(pathname)) {
    return NextResponse.next(); // 認可OK
  }

  // ====== 認証 =======

  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // ====== 認可 =======

  // アクセス禁止パス保護
  const isBlocked = isBlockedClientPath(pathname);
  if (isBlocked) {
    return NextResponse.rewrite(new URL("/404", req.url));
  }

  return NextResponse.next(); // 認可OK
}

export const config = {
  matcher: ["/((?!_next).*)"],
};
