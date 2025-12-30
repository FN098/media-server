import { PASS, USER } from "@/basic-auth";
import { blackListPrefixes } from "@/lib/path/blacklist";
import { NextRequest, NextResponse } from "next/server";

// TODO: BASIC認証以外を実装
export function proxy(req: NextRequest) {
  // ====== 認証 =======

  const auth = req.headers.get("authorization");

  if (!auth) {
    // ブラウザに BASIC 認証を要求
    return new NextResponse("Auth required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  }

  // 認証方式とBASE64文字列を取得
  const [scheme, encoded] = auth.split(" ");

  if (scheme !== "Basic") {
    // BASIC 認証以外はサポートしない
    return new NextResponse("Invalid auth scheme", { status: 400 });
  }

  // BASE64 文字列をデコード => USER:PASS
  const decoded = Buffer.from(encoded, "base64").toString();
  const [user, pass] = decoded.split(":");

  if (user !== USER || pass !== PASS) {
    // ユーザーとパスワードが一致しない場合は再入力
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
    });
  }

  // ====== 認可 =======

  const pathname = req.nextUrl.pathname;

  // ブラックリスト判定
  const isBlocked = blackListPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

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
