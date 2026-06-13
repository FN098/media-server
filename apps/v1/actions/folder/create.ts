"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { getServerMediaPath } from "@/lib/path/helpers";
import { existsPath } from "@/lib/utils/fs";
import { sanitize } from "@/lib/virtual-path/guard";
import { join } from "@/lib/virtual-path/path";
import {
  EditableVirtualPathSchema,
  FileOrFolderNameSchema,
} from "@/lib/virtual-path/schemas";
import { mkdir } from "fs/promises";
import { revalidatePath } from "next/cache";
import z from "zod";

const InputSchema = z.object({
  parentPath: EditableVirtualPathSchema,
  folderName: FileOrFolderNameSchema,
});

type ActionResult =
  | { success: true }
  | {
      success: false;
      message: string;
    };

// フォルダ作成
export async function createFolderAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { parentPath, folderName } = parsed.data;

  // 認証＋認可
  const auth = await authorize("folder:create");
  if (!auth.success) {
    return auth;
  }

  // 仮想パス→物理パス
  const newVirtualPath = sanitize(join(parentPath, folderName));
  const newRealPath = getServerMediaPath(newVirtualPath);

  if (await existsPath(newRealPath)) {
    return {
      success: false,
      message: "同名のフォルダまたはファイルが既に存在します。",
    };
  }

  try {
    await mkdir(newRealPath, { recursive: true });
  } catch (error) {
    logger.error("action:create-folder", error);
    return {
      success: false,
      message: "フォルダの作成に失敗しました。",
    };
  }

  // キャッシュ更新
  revalidatePath("/explorer");

  return { success: true };
}
