"use server";
import { logger } from "@/lib/logger";
import { getServerMediaPath } from "@/lib/path/helpers";
import { VirtualPathOneSchema } from "@/lib/virtual-path/schemas";
import fs from "fs/promises";
import iconv from "iconv-lite";
import jschardet from "jschardet";

const MAX_READ_SIZE = 100 * 1024; // 100KB

type ReadAsTextResult =
  | {
      success: false;
      message: string;
      errors?: { prop: string; issues?: unknown[] }[];
    }
  | {
      success: true;
      isText: boolean;
      content: string;
      isTruncated: boolean;
      encoding: string;
    };

// プレビュー取得
export async function readAsTextAction(
  path: string
): Promise<ReadAsTextResult> {
  // 入力バリデーション＋正規化
  const parsed = {
    path: VirtualPathOneSchema.safeParse(path),
  };
  if (!parsed.path.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [{ prop: "path", issues: parsed.path.error?.issues }],
    };
  }

  const normalizedPath = parsed.path.data;

  const realPath = getServerMediaPath(normalizedPath);

  try {
    const stat = await fs.stat(realPath);
    if (!stat.isFile())
      return { success: false, message: "ファイルではありません。" };

    // 先頭から制限サイズ分だけバッファとして読み込む
    const readSize = Math.min(stat.size, MAX_READ_SIZE);
    const buffer = Buffer.alloc(readSize);
    const fd = await fs.open(realPath, "r");
    await fd.read(buffer, 0, readSize, 0);
    await fd.close();

    // 簡易的なバイナリチェック（ヌルバイトが含まれている場合はバイナリとみなす）
    const isProbablyBinary = buffer.includes(0);

    // 文字コードの判定 (jschardet)
    // 精度を上げるため、バッファ全体ではなく最初の数KB〜全体を渡す
    const detected = jschardet.detect(buffer);

    // 信頼度（confidence）が低すぎる場合はデフォルトの挙動にするか、バイナリ扱いにする
    // 例: 信頼度 0.5 未満なら UTF-8 と仮定、または非テキスト扱い
    let encoding = detected.encoding || "UTF-8";

    // jschardet の戻り値が ascii の場合は UTF-8 と互換性があるのでそのまま扱える
    if (encoding.toLowerCase() === "ascii") {
      encoding = "UTF-8";
    }

    // 判定された文字コードでデコード
    // 対応していないエンコード名が返ってきたときのために try-catch
    let content = "";
    try {
      content = iconv.decode(buffer, encoding);
    } catch {
      // 変換に失敗したら UTF-8 で強引にフォールバック
      content = buffer.toString("utf-8");
      encoding = "UTF-8";
    }

    const isTruncated = stat.size > MAX_READ_SIZE;

    return {
      success: true,
      isText: !isProbablyBinary,
      content,
      isTruncated,
      encoding,
    };
  } catch (e) {
    logger.error("action:read-as-text", e);
    return {
      success: false,
      message: "ファイル読み込みに失敗しました。",
    };
  }
}
