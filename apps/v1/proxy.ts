import { auth } from "@/lib/auth/better-auth";
import { isBlockedClientPath } from "@/lib/path/protections";
import { isPublic } from "@/lib/routing/public-routes";
import { NextRequest, NextResponse } from "next/server";

let hasAdminCache: boolean | null = null;

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 一般公開系のパスは素通し
  if (isPublic(pathname)) {
    return NextResponse.next(); // 認可OK
  }

  // ====== 管理者検証 =======

  if (hasAdminCache !== true) {
    hasAdminCache = await hasAdmin();
  }

  if (!hasAdminCache) {
    return NextResponse.redirect(new URL("/sign-up", req.url));
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

async function hasAdmin() {
  // NOTE: edge 環境なので prisma は使えない & 自分自身へのリクエストなので公開用URLは使えない
  const baseUrl = process.env.INTERNAL_API_URL ?? "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/auth/has-admin`, {
    cache: "no-store",
  });

  const data = (await res.json()) as { hasAdmin?: boolean };

  return data.hasAdmin ?? true; // フォールバックは true としておく
}
