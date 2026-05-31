import { authenticate, parseCredentials } from "@/lib/auth/basic-auth";
import { isBlockedClientPath } from "@/lib/path/protections";
import { NextRequest, NextResponse } from "next/server";

function unauthorized(message = "Unauthorized") {
  return new NextResponse(message, {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
}

export function proxy(req: NextRequest) {
  // ====== 認証 =======

  const credentials = parseCredentials(req.headers);
  if (!credentials) {
    // ブラウザに BASIC 認証を要求
    return unauthorized("Auth required");
  }

  const user = authenticate(credentials);
  if (!user) {
    // ユーザーとパスワードが一致しない場合は再入力
    return unauthorized();
  }

  // ====== 認可 =======

  const pathname = req.nextUrl.pathname;

  // アクセス禁止パス保護
  const isBlocked = isBlockedClientPath(pathname);
  if (isBlocked) {
    // 404 に見せる
    return NextResponse.rewrite(new URL("/404", req.url));
  }

  // OK
  return NextResponse.next();
}

export const config = {
  matcher: [
    // _next と api を“除外して”、それ以外すべてに認証をかける
    "/((?!_next|api).*)",
  ],
};
