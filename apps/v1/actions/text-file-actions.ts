"use server";
import { getServerMediaPath } from "@/lib/path/helpers";
import fs from "fs/promises";
import iconv from "iconv-lite";
import jschardet from "jschardet";

const MAX_PREVIEW_SIZE = 100 * 1024; // 100KB

// プレビュー取得
export async function getTextFilePreviewAction(virtualPath: string) {
  const normalizedPath = virtualPath.replace(/^\//, ""); // 先頭のスラッシュをトリミング

  const realPath = getServerMediaPath(normalizedPath);

  try {
    const stat = await fs.stat(realPath);
    if (!stat.isFile()) return { isText: false };

    // 1. 先頭から制限サイズ分だけバッファとして読み込む
    const readSize = Math.min(stat.size, MAX_PREVIEW_SIZE);
    const buffer = Buffer.alloc(readSize);
    const fd = await fs.open(realPath, "r");
    await fd.read(buffer, 0, readSize, 0);
    await fd.close();

    // 2. 簡易的なバイナリチェック（ヌルバイトが含まれている場合はバイナリとみなす）
    if (buffer.includes(0)) {
      return { isText: false };
    }

    // 3. 文字コードの判定 (jschardet)
    // 精度を上げるため、バッファ全体ではなく最初の数KB〜全体を渡す
    const detected = jschardet.detect(buffer);

    // 信頼度（confidence）が低すぎる場合はデフォルトの挙動にするか、バイナリ扱いにする
    // 例: 信頼度 0.5 未満なら UTF-8 と仮定、または非テキスト扱い
    let encoding = detected.encoding || "UTF-8";

    // jschardet の戻り値が ascii の場合は UTF-8 と互換性があるのでそのまま扱える
    if (encoding.toLowerCase() === "ascii") {
      encoding = "UTF-8";
    }

    // 4. 判定された文字コードでデコード
    // 対応していないエンコード名が返ってきたときのために try-catch
    let content = "";
    try {
      content = iconv.decode(buffer, encoding);
    } catch {
      // 変換に失敗したら UTF-8 で強引にフォールバック
      content = buffer.toString("utf-8");
      encoding = "UTF-8";
    }

    const isTruncated = stat.size > MAX_PREVIEW_SIZE;

    return {
      isText: true,
      content,
      isTruncated,
      encoding,
    };
  } catch (e) {
    console.error("Text file read error", e);
    return { isText: false };
  }
}
