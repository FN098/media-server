import kuromoji, { IpadicFeatures, Tokenizer } from "kuromoji";

// キャッシュ変数に型を適用（IpadicFeatures を持つ Tokenizer）
let cachedTokenizer: Tokenizer<IpadicFeatures> | null = null;

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
      // IpadicFeatures の型定義に基づき、reading があれば優先、なければ原文(surface_form)
      return token.reading ? token.reading : token.surface_form;
    })
    .join("");
}
