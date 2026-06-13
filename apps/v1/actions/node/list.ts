"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { detectMediaType } from "@/lib/media/detectors";
import { MediaType } from "@/lib/media/types";
import { getServerMediaPath } from "@/lib/path/helpers";
import { isFsNotFoundError, isFsPermissionError } from "@/lib/utils/fs";
import { sanitize } from "@/lib/virtual-path/guard";
import { join } from "@/lib/virtual-path/path";
import { EditableVirtualPathSchema } from "@/lib/virtual-path/schemas";
import { readdir } from "fs/promises";
import z from "zod";

const InputSchema = z.object({
  dirPath: EditableVirtualPathSchema,
});

type ActionResult =
  | {
      success: true;
      files: {
        name: string;
        path: string;
        type: MediaType;
      }[];
    }
  | {
      success: false;
      message: string;
      errors?: { prop: string; issues?: unknown[] }[];
    };

// メディアファイル一覧
export async function listMediaAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { dirPath } = parsed.data;

  // 認証＋認可
  const auth = await authorize("folder:list-media");
  if (!auth.success) {
    return auth;
  }

  // 仮想パス→物理パス
  const virtualDirPath = dirPath;
  const realDirPath = getServerMediaPath(virtualDirPath);

  try {
    const entries = await readdir(realDirPath, { withFileTypes: true });

    const mediaFiles = entries
      .filter((e) => e.isFile()) // ファイルのみ対象
      .map((e) => {
        const type = detectMediaType(e.name);
        if (type === null) return null; // メディア以外を除く
        return {
          name: e.name,
          path: sanitize(join(virtualDirPath, e.name)),
          type,
        };
      })
      .filter((e) => e !== null);

    return {
      success: true,
      files: mediaFiles,
    };
  } catch (e) {
    if (isFsNotFoundError(e)) {
      return { success: false, message: "フォルダが見つかりません。" };
    }
    if (isFsPermissionError(e)) {
      return {
        success: false,
        message: "フォルダへのアクセス権がありません。",
      };
    }
    logger.error("action:list-media", e);
    return { success: false, message: "ファイル一覧の取得に失敗しました。" };
  }
}
