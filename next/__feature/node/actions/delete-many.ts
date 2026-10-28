"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { db } from "@/lib/prisma";
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

// 削除（ゴミ箱フォルダへの移動）
export async function deleteManyNodesAction({
  nodes,
}: {
  nodes: {
    id: string;
    isDirectory: boolean;
  }[];
}): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize("file:delete-many", "folder:delete-many");
  if (!auth.success) {
    return auth;
  }

  const completed: Success["completed"] = [];
  const failed: Success["failed"] = [];
  const skipped: Success["skipped"] = [];

  for (const node of nodes) {
    // DB更新
    try {
      if (node.isDirectory) {
        await db.folder.update({
          where: { id: node.id },
          data: { deletedAt: new Date() },
        });
      } else {
        await db.file.update({
          where: { id: node.id },
          data: { deletedAt: new Date() },
        });
      }
    } catch (error) {
      logger.error("action:delete-many-nodes-permamently", error);
      failed.push({
        id: node.id,
        message: "ファイルまたはフォルダの削除に失敗しました。",
      });
      continue;
    }

    completed.push({ id: node.id });
  }

  // キャッシュの更新
  if (completed.length > 0) {
    revalidatePath("/explorer");
    revalidatePath("/trash");
  }

  return {
    success: true,
    completed,
    failed,
    skipped,
  };
}
