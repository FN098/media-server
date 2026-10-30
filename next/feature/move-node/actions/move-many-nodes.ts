"use server";

import { renameNodeInDb } from "@/__lib/node/services";
import {
  getServerMediaPath,
  getServerMediaThumbPath,
} from "@/__lib/path/helpers";
import { authorize } from "@/lib/authorization/authorize";
import { getFolderPath } from "@/lib/folder/repository";
import { resolveMediaPath, resolveMediaThumbnailPath } from "@/lib/fs/resolvers";
import { logger } from "@/lib/logger";
import { isFsNotFoundError } from "@/lib/utils/fs";
import { basename, extname, join } from "@/lib/virtual-path";
import { resolve } from "dns";
import { readdir, rename, rm } from "fs/promises";
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

// TODO: fix (サムネイルをファイルIDと1:1で管理)
// 移動
export async function moveManyNodesAction({
  nodes,
  destFolderId,
}: {
  nodes: {
    id: string;
    name: string;
    isDirectory: boolean;
  }[];
  destFolderId: string;
}): Promise<ActionResult> {
  // 認証＋認可
  const auth = await authorize("file:move-many", "folder:move-many");
  if (!auth.success) {
    return auth;
  }

  let virtualDestDirPath: string;
  try {
    virtualDestDirPath = await getFolderPath(destFolderId);
  } catch (error) {
    logger.error("move-many-nodes-action:get-dest-folder-path", error);
    return {
      success: false,
      message: "ファイルまたはフォルダの移動に失敗しました。",
    };
  }

  // 仮想パス→物理パス
  const realDestDirPath = resolveMediaPath(virtualDestDirPath);

  // ディレクトリ内のエントリ名一覧を取得（後続の自動連番で使う）
  const existingNames = new Set<string>();
  try {
    const entries = await readdir(realDestDirPath);
    entries.forEach((name) => existingNames.add(name));
  } catch (error) {
    logger.error("move-many-nodes-action:read-dest-directory", error);
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
    const destRealPath = join(realDestDirPath, newName)

    const srcThumbPath = resolveMediaThumbnailPath(virtual, isDirectory);
    const destThumbPath = resolve getServerMediaThumbPath(destVirtualPath, isDirectory);

    // サムネイル移動前処理
    try {
      await rm(destThumbPath, { recursive: true, force: true });
    } catch (e) {
      logger.error("action:move:thumb-preprocess", e);
      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダの移動に失敗しました。",
      });
      continue;
    }

    // サムネイル移動
    let thumbMoved = false;
    try {
      await rename(srcThumbPath, destThumbPath);
      thumbMoved = true;
    } catch (e) {
      // not found （未作成）の場合は処理継続、それ以外は失敗
      if (!isFsNotFoundError(e)) {
        logger.error("action:move:thumb", e);
        failed.push({
          path: srcVirtualPath,
          message: "ファイルまたはフォルダの移動に失敗しました。",
        });
        continue;
      }
    }

    // FS移動
    try {
      await rename(srcRealPath, destRealPath);
    } catch (e) {
      logger.error("action:move:fs", e);

      // サムネイルロールバック
      if (thumbMoved) {
        try {
          await rename(destThumbPath, srcThumbPath);
        } catch (e) {
          logger.error("action:move:fs:thumb-rollback", e);
        }
      }

      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダの移動に失敗しました。",
      });
      continue;
    }

    // DB更新
    try {
      await renameNodeInDb({ srcVirtualPath, destVirtualPath, isDirectory });
    } catch (e) {
      logger.error("action:move:db", e);

      // FSロールバック
      try {
        await rename(destRealPath, srcRealPath);
      } catch (e) {
        logger.error("action:move:db:fs-rollback", e);
      }

      // サムネイルロールバック
      if (thumbMoved) {
        try {
          await rename(destThumbPath, srcThumbPath);
        } catch (e) {
          logger.error("action:move:db:thumb-rollback", e);
        }
      }

      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダの移動に失敗しました。",
      });
      continue;
    }

    completed.push({ path: srcVirtualPath });

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
