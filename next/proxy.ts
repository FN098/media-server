import { auth } from "@/lib/auth/better-auth";
import { logger } from "@/lib/logger";
import { isPublicRoute } from "@/lib/routing/public-routes";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 一般公開パスは素通し
  if (isPublicRoute(pathname)) {
    return NextResponse.next(); // 認可OK
  }

  // ====== 認証 =======

  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    logger.info("proxy", "NO SESSION", {
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

    const signInUrl = new URL("/sign-in", req.url);

    const currentUrl = req.nextUrl.pathname + req.nextUrl.search;
    if (currentUrl) {
      signInUrl.searchParams.set("redirectTo", currentUrl);
    }

    return NextResponse.redirect(signInUrl);
  }

  // ====== 認可 =======

  return NextResponse.next(); // 認可OK
}

export const config = {
  matcher: ["/((?!_next|api).*)"],
};
