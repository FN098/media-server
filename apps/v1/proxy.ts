import { PASS, USER } from "@/basic-auth";
import { NextRequest, NextResponse } from "next/server";

// TODO: BASIC認証以外を実装
export function proxy(req: NextRequest) {
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

  // OK
  return NextResponse.next();
}

export const config = {
  matcher: [
    // _next と api を“除外して”、それ以外すべてに認証をかける
    "/((?!_next|api).*)",
  ],
};
