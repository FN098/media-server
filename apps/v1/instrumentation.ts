import { PASS, USER } from "@/basic-auth";

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("サーバーが起動しました。ここで初期化処理を実行します。");
    console.log("BASIC 認証情報", { USER, PASS });
  }
}
