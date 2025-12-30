"use server";

import { USER } from "@/basic-auth";
import { PATHS } from "@/lib/path/paths";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function visitFolderAction(dirPath: string): Promise<void> {
  // TODO: ユーザー認証機能実装後に差し替える
  await visitFolder(dirPath, USER);

  // ダッシュボードの履歴キャッシュをクリア
  revalidatePath(PATHS.client.dashboard.root);
}

async function visitFolder(dirPath: string, userId: string): Promise<void> {
  const normalizedDirPath = dirPath.replace(/\/+$/, "");

  // 最近訪れたフォルダを更新
  await prisma.$transaction(async (tx) => {
    await tx.visitedFolder.upsert({
      where: {
        userId_dirPath: {
          userId,
          dirPath: normalizedDirPath,
        },
      },
      update: {
        lastViewedAt: new Date(),
      },
      create: {
        userId,
        dirPath: normalizedDirPath,
      },
    });
  });
}
