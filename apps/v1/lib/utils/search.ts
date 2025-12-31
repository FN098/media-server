/**
 * 日本語の揺れを抑えて比較するための正規化
 * - 全角英数字を半角に
 * - カタカナをひらがなに変換
 * - 大文字を小文字に
 */
export function normalizeJapanese(text: string): string {
  return text
    .normalize("NFKC") // 全角英数字を半角に、濁点を結合文字から合成文字に
    .replace(/[\u30a1-\u30f6]/g, (match) => {
      // カタカナをひらがなに変換
      return String.fromCharCode(match.charCodeAt(0) - 0x60);
    })
    .toLowerCase();
}

/**
 * 日本語全文検索の判定
 */
export function isMatchJapanese(target: string, query: string): boolean {
  const normalizedTarget = normalizeJapanese(target);
  const normalizedQuery = normalizeJapanese(query);
  return normalizedTarget.includes(normalizedQuery);
}
