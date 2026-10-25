"use server";

import { authorize } from "@/__lib/authorization/authorize";
import { getFilePath } from "@/__lib/file/repository";
import { getFolderPath } from "@/__lib/folder/repository";
import { logger } from "@/__lib/logger";
import { getServerMediaTrashPath } from "@/__lib/path/helpers";
import { rm } from "fs/promises";
import { revalidatePath } from "next/cache";

type ActionResult =
  | {
      success: true;
      completed: { id: string }[];
      failed: { id: string; message: string }[];
      skipped: { id: string; message: string }[];
    }
  | {
      success: false;
      message: string;
    };

type Success = Extract<ActionResult, { success: true }>;

// 完全に削除
export async function deleteManyNodesPermanentlyAction({
  nodes,
}: {
  nodes: {
    id: string;
    isDirectory: boolean;
  }[];
}): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize(
    "file:delete-many-permanently",
    "folder:delete-many-permanently"
  );
  if (!auth.success) {
    return auth;
  }

  const completed: Success["completed"] = [];
  const failed: Success["failed"] = [];
  const skipped: Success["skipped"] = [];

  for (const node of nodes) {
    const srcVirtualPath = node.isDirectory
      ? await getFolderPath(node.id)
      : await getFilePath(node.id);

    // 仮想パス→物理パス
    const srcRealPath = getServerMediaTrashPath(srcVirtualPath);

    // FS削除
    try {
      await rm(srcRealPath, { recursive: true, force: true });
    } catch (error) {
      logger.error("action:delete-many-nodes-permamently", error);
      failed.push({
        id: node.id,
        message: "ファイルまたはフォルダの削除に失敗しました。",
      });
      continue;
    }

    // TODO: DB更新

    completed.push({ id: node.id });
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
