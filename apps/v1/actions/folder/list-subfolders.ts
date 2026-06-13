"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { getServerMediaPath } from "@/lib/path/helpers";
import { isBlockedVirtualPath } from "@/lib/path/protections";
import { isFsNotFoundError, isFsPermissionError } from "@/lib/utils/fs";
import { isRootPath, sanitize } from "@/lib/virtual-path/guard";
import { join } from "@/lib/virtual-path/path";
import { EditableVirtualPathSchema } from "@/lib/virtual-path/schemas";
import { readdir } from "fs/promises";
import z from "zod";

const InputSchema = z.object({
  dirPath: z.union([
    z.string().refine((path) => isRootPath(path)),
    EditableVirtualPathSchema,
  ]),
});

type ActionResult =
  | {
      success: true;
      folders: { name: string; path: string }[];
    }
  | {
      success: false;
      message: string;
      errors?: { prop: string; issues?: unknown[] }[];
    };

// サブフォルダ一覧
export async function listSubFoldersAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { dirPath } = parsed.data;

  // 認証＋認可
  const auth = await authorize("folder:list-subfolders");
  if (!auth.success) {
    return auth;
  }

  // フォルダ保護
  if (isBlockedVirtualPath(dirPath)) {
    return {
      success: false,
      message: "このフォルダにはアクセスできません。",
    };
  }

  // 仮想パス→物理パス
  const realDirPath = getServerMediaPath(dirPath);

  try {
    const entries = await readdir(realDirPath, { withFileTypes: true });

    return {
      success: true,
      folders: entries
        .filter((e) => e.isDirectory())
        .map((e) => ({
          name: e.name,
          path: sanitize(join(dirPath, e.name)),
        })),
    };
  } catch (e) {
    if (isFsNotFoundError(e)) {
      return {
        success: false,
        message: "フォルダが見つかりません。",
      };
    }
    if (isFsPermissionError(e)) {
      return {
        success: false,
        message: "フォルダへのアクセス権がありません。",
      };
    }
    logger.error("action:list-sub-folders", e);
    return {
      success: false,
      message: "サブフォルダ一覧の取得に失敗しました。",
    };
  }
}
