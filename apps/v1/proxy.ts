import { auth } from "@/lib/auth/better-auth";
import { isBlockedClientPath } from "@/lib/path/protections";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  // ====== 認証 =======

  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ====== 認可 =======

  const pathname = req.nextUrl.pathname;

  // アクセス禁止パス保護
  const isBlocked = isBlockedClientPath(pathname);
  if (isBlocked) {
    return NextResponse.rewrite(new URL("/404", req.url));
  }

  // OK
  return NextResponse.next();
}

export const config = {
  matcher: [
    // _next, api, login などを除外して、それ以外すべてに認証をかける
    "/((?!_next|api|login).*)",
  ],
};
