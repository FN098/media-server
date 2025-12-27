// Edge/Node 環境で動く初期化処理

export function register() {
  console.log("Next.js Server Runtime Started");

  // nodejs 用のコードは動的インポートで実行
  if (process.env.NEXT_RUNTIME === "nodejs") {
    void import("./instrumentation.node").then((m) => m.registerNodeOnly());
  }
}
