"use server";

import { authorize } from "@/lib/authorization/authorize";
import { renameFile } from "@/lib/file/repository";
import { getFolderPath, renameFolder } from "@/lib/folder/repository";
import { resolveMediaPath } from "@/lib/fs/resolvers";
import { logger } from "@/lib/logger";
import { basename, extname, join } from "@/lib/virtual-path";
import { readdir, rename } from "fs/promises";
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

// 移動
export async function moveManyNodesAction({
  nodes,
  srcFolderId,
  destFolderId,
}: {
  nodes: {
    id: string;
    name: string;
    isDirectory: boolean;
  }[];
  srcFolderId: string;
  destFolderId: string;
}): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize("move-many-files-or-folders");
  if (!auth.success) {
    return auth;
  }

  let srcVirtualDirPath: string;
  let destVirtualDirPath: string;
  try {
    srcVirtualDirPath = await getFolderPath(srcFolderId);
    destVirtualDirPath = await getFolderPath(destFolderId);
  } catch (error) {
    logger.error("move-many-nodes-action", error);
    return {
      success: false,
      message: "ファイルまたはフォルダの移動に失敗しました。",
    };
  }

  // 仮想パス→物理パス
  const srcRealDirPath = resolveMediaPath(srcVirtualDirPath);
  const destRealDirPath = resolveMediaPath(destVirtualDirPath);

  // ディレクトリ内のエントリ名一覧を取得（後続の自動連番で使う）
  const existingNames = new Set<string>();
  try {
    const entries = await readdir(destRealDirPath);
    entries.forEach((name) => existingNames.add(name));
  } catch (error) {
    logger.error("move-many-nodes-action", error);
    return {
      success: false,
      message: "ファイルまたはフォルダの移動に失敗しました。",
    };
  }

  const completed: Success["completed"] = [];
  const failed: Success["failed"] = [];
  const skipped: Success["skipped"] = [];

  for (const node of nodes) {
    // 新しい名前を確定（名前衝突があれば (2), (3), ... などの連番を付与）
    let newName = node.name;
    let counter = 2;
    while (existingNames.has(newName)) {
      if (node.isDirectory) {
        // フォルダの場合: 「フォルダ名 (2)」
        newName = `${node.name} (${counter})`;
      } else {
        // ファイルの場合: 「ファイル名 (2).ext」
        const ext = extname(node.name);
        const base = basename(node.name, ext);
        newName = `${base} (${counter})${ext}`;
      }
      counter++;
    }

    // 最終的なパスを決定
    const srcRealPath = join(srcRealDirPath, node.name);
    const destRealPath = join(destRealDirPath, newName);

    // FS移動
    try {
      await rename(srcRealPath, destRealPath);
    } catch (error) {
      logger.error("move-many-node-action", error);

      failed.push({
        id: node.id,
        message: "ファイルまたはフォルダの移動に失敗しました。",
      });
      continue;
    }

    // DB更新
    try {
      if (node.isDirectory) {
        await renameFolder({ id: node.id, newName });
      } else {
        await renameFile({ id: node.id, newName });
      }
    } catch (error) {
      logger.error("move-many-node-action", error);

      // FSロールバック
      try {
        await rename(destRealPath, srcRealPath);
      } catch (error) {
        logger.error("move-many-node-action", error);
      }

      failed.push({
        id: node.id,
        message: "ファイルまたはフォルダの移動に失敗しました。",
      });
      continue;
    }

    completed.push({ id: node.id });

    // 次のループのファイルがこれと衝突するのを防ぐため、確定した名前を Set に予約登録
    existingNames.add(newName);
  }

  // キャッシュの更新
  if (completed.length > 0) {
    revalidatePath("/explorer");
  }

  return {
    success: true,
    completed,
    failed,
    skipped,
  };
}
