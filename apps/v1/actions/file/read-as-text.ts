"use server";
import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { getServerMediaPath } from "@/lib/path/helpers";
import { getPathInfo } from "@/lib/utils/fs";
import { EditableVirtualPathSchema } from "@/lib/virtual-path/schemas";
import fs from "fs/promises";
import iconv from "iconv-lite";
import jschardet from "jschardet";
import z from "zod";

const MAX_READ_SIZE = 100 * 1024; // 100KB

const InputSchema = z.object({
  path: EditableVirtualPathSchema,
});

type ActionResult =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      isText: boolean;
      content: string;
      isTruncated: boolean;
      encoding: string;
    };

// テキストデータ取得
export async function readAsTextAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { path } = parsed.data;

  // 認証＋認可
  const auth = await authorize("file:read-as-text");
  if (!auth.success) {
    return auth;
  }

  const realPath = getServerMediaPath(path);

  const pathInfo = await getPathInfo(realPath);
  if (!pathInfo.exists) {
    return {
      success: false,
      message:
        pathInfo.error === "not-found"
          ? "パスが存在しません。"
          : "パスにアクセスできません。",
    };
  }
  if (pathInfo.isDirectory) {
    return { success: false, message: "ファイルではありません。" };
  }

  const fileSize = pathInfo.size;
  const readSize = Math.min(fileSize, MAX_READ_SIZE);

  try {
    // 先頭から制限サイズ分だけバッファとして読み込む
    const buffer = await readBuffer(realPath, readSize);

    // 簡易的なバイナリチェック（ヌルバイトが含まれている場合はバイナリとみなす）
    const isProbablyBinary = buffer.includes(0);

    const { content, encoding } = decodeBuffer(
      buffer,
      isProbablyBinary ? "UTF-8" : undefined
    );

    return {
      success: true,
      isText: !isProbablyBinary,
      content,
      isTruncated: fileSize > MAX_READ_SIZE,
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

async function readBuffer(path: string, size: number): Promise<Buffer> {
  const buffer = Buffer.alloc(size);
  const fd = await fs.open(path, "r");
  await fd.read(buffer, 0, size, 0);
  await fd.close();
  return buffer;
}

function detectEncoding(buffer: Buffer): string {
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

  return encoding;
}

function decodeBuffer(
  buffer: Buffer,
  encoding?: string
): { content: string; encoding: string } {
  if (!encoding) {
    encoding = detectEncoding(buffer);
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

  return { content, encoding };
}
