import { auth } from "@/lib/auth/better-auth";
import { logger } from "@/lib/logger";
import { isBlockedClientPath } from "@/lib/path/protections";
import { isPublicRoute } from "@/lib/routing/public-routes";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 一般公開パスは素通し
  if (isPublicRoute(pathname)) {
    return NextResponse.next(); // 認可OK
  }

  // TODO: セッション有効期限切れの回避策。後で有効化する
  // const isPrefetch =
  //   req.headers.get("purpose") === "prefetch" ||
  //   req.headers.has("next-router-prefetch");

  // if (isPrefetch) {
  //   return NextResponse.next();
  // }

  // TODO: セッション有効期限切れしていないのにサインインページにリダイレクトされる問題を調べる
  logger.info("proxy", "request info", {
    time: new Date(),
    path: pathname,
    url: req.url,
    currentUrl: req.nextUrl.pathname + req.nextUrl.search,
    cookie: req.headers.get("cookie"),
    purpose: req.headers.get("purpose"),
    prefetch: req.headers.get("next-router-prefetch"),
    userAgent: req.headers.get("user-agent"),
    host: req.headers.get("host"),
    xForwardedHost: req.headers.get("x-forwarded-host"),
    xForwardedProto: req.headers.get("x-forwarded-proto"),
  });

  // ====== 認証 =======

  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    const signInUrl = new URL("/sign-in", req.url);

    const currentUrl = req.nextUrl.pathname + req.nextUrl.search;
    if (currentUrl) {
      signInUrl.searchParams.set("redirectTo", currentUrl);
    }

    return NextResponse.redirect(signInUrl);
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
  matcher: ["/((?!_next|api).*)"],
};
