export function normalizeTagName(input: string): string {
  let s = input;

  // 前後トリム
  s = s.trim();

  // 全角英数 → 半角
  s = s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0)
  );

  // 全角括弧 → 半角
  s = s.replace(/（/g, "(").replace(/）/g, ")");

  // 括弧の内側スペース削除
  s = s.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");

  // "(" の前は半角スペース1つ（先頭除外）
  s = s.replace(/([^\s])\(/g, "$1 (");

  // 全角スペース → 半角
  s = s.replace(/　/g, " ");

  // スペース連続を1つに
  s = s.replace(/\s+/g, " ");

  // 必要なら小文字化
  // s = s.toLowerCase();

  return s;
}
