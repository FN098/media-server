import kuromoji, { IpadicFeatures, Tokenizer } from "kuromoji";

// キャッシュ変数に型を適用（IpadicFeatures を持つ Tokenizer）
let cachedTokenizer: Tokenizer<IpadicFeatures> | null = null;

/**
 * ひらがなをカタカナに変換するユーティリティ
 */
function toKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) + 0x60);
  });
}

/**
 * タグ名から読み（カタカナ）を自動生成する
 */
export async function generateKana(text: string): Promise<string> {
  const tokenizer = await new Promise<Tokenizer<IpadicFeatures>>(
    (resolve, reject) => {
      if (cachedTokenizer) {
        return resolve(cachedTokenizer);
      }

      kuromoji
        .builder({ dicPath: "node_modules/kuromoji/dict" })
        .build((err, result) => {
          if (err) {
            return reject(err);
          }
          cachedTokenizer = result;
          resolve(result);
        });
    }
  );

  // tokens は IpadicFeatures[] 型になる
  const tokens = tokenizer.tokenize(text);

  return tokens
    .map((token: IpadicFeatures) => {
      // 1. 読み(reading)があればそれを使う
      // 2. なければ原文(surface_form)を使う
      const base = token.reading ? token.reading : token.surface_form;

      // ひらがなが含まれる可能性があるのでカタカナに変換
      return toKatakana(base);
    })
    .join("");
}
