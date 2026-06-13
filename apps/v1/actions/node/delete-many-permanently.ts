"use server";

import { DeleteNodesSuccess } from "@/actions/node/delete-many";
import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { getServerMediaTrashPath } from "@/lib/path/helpers";
import { EditableVirtualPathManySchema } from "@/lib/virtual-path/schemas";
import { rm } from "fs/promises";
import { revalidatePath } from "next/cache";
import z from "zod";

const InputSchema = z.object({
  sourcePaths: EditableVirtualPathManySchema.min(
    1,
    "ファイルまたはフォルダを1件以上指定してください。"
  ),
});

export type ActionResult =
  | {
      success: true;
      completed: { path: string }[];
      failed: { path: string; message: string }[];
      skipped: { path: string; message: string }[];
    }
  | {
      success: false;
      message: string;
    };

// 完全に削除
export async function deleteManyNodesPermanentlyAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { sourcePaths } = parsed.data;

  // 認証＋認可
  const auth = await authorize(
    "file:delete-many-permanently",
    "folder:delete-many-permanently"
  );
  if (!auth.success) {
    return auth;
  }

  const completed: DeleteNodesSuccess["completed"] = [];
  const failed: DeleteNodesSuccess["failed"] = [];
  const skipped: DeleteNodesSuccess["skipped"] = [];

  for (const srcVirtualPath of sourcePaths) {
    // 仮想パス→物理パス
    const srcRealPath = getServerMediaTrashPath(srcVirtualPath);

    // FS削除
    try {
      await rm(srcRealPath, { recursive: true, force: true });
    } catch (error) {
      logger.error("action:delete-many-nodes-permamently", error);
      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダの削除に失敗しました。",
      });
      continue;
    }

    // DB更新不要
    completed.push({ path: srcVirtualPath });
  }

  // キャッシュの更新
  if (completed.length > 0) {
    revalidatePath("/trash");
  }

  return {
    success: true,
    completed,
    failed,
    skipped,
  };
}
