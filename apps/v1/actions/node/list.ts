"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { logger } from "@/lib/logger";
import { detectMediaType } from "@/lib/media/detectors";
import { MediaType } from "@/lib/media/types";
import { getServerMediaPath } from "@/lib/path/helpers";
import { isSystemHiddenVirtualPath } from "@/lib/path/protections";
import { isFsNotFoundError, isFsPermissionError } from "@/lib/utils/fs";
import { isRootPath, sanitize } from "@/lib/virtual-path/guard";
import { join } from "@/lib/virtual-path/path";
import { VirtualPathSchema } from "@/lib/virtual-path/schemas";
import { Dirent } from "fs";
import { readdir } from "fs/promises";

type ListMediaActionResult =
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
  dirPath: string
): Promise<ListMediaActionResult> {
  // 入力バリデーション＋正規化
  if (!dirPath) {
    return {
      success: false,
      message: "処理対象のパスまたは名前が指定されていません。",
    };
  }

  const parsed = {
    dirPath: VirtualPathSchema.safeParse(sanitize(dirPath)),
  };
  if (!parsed.dirPath.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [{ prop: "dirPath", issues: parsed.dirPath.error?.issues }],
    };
  }

  const normalizedDirPath = parsed.dirPath.data;

  // ルートフォルダ保護
  if (isRootPath(normalizedDirPath)) {
    return { success: false, message: "ルートフォルダは操作できません。" };
  }

  // システムフォルダ保護
  if (isSystemHiddenVirtualPath(normalizedDirPath)) {
    return { success: false, message: "システムフォルダは操作できません。" };
  }

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "認証されていません。",
    };
  }

  // 仮想パス→物理パス
  const virtualDirPath = normalizedDirPath;
  const realDirPath = getServerMediaPath(virtualDirPath);

  let entries: Dirent[];
  try {
    entries = await readdir(realDirPath, { withFileTypes: true });
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

  const mediaFiles = entries
    .filter((e) => e.isFile()) // ファイルのみ対象
    .map((e) => {
      const type = detectMediaType(e.name);
      if (type === null) return null; // メディア以外を除く
      return {
        name: e.name,
        // 仮想パスを生成
        path: join(virtualDirPath, e.name).replace(/\\/g, "/"),
        type,
      };
    })
    .filter((e) => e !== null);

  return {
    success: true,
    files: mediaFiles,
  };
}
