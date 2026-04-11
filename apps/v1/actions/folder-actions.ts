"use server";

import { resolveCurrentUserOrThrow } from "@/lib/auth/resolver";
import { fsNameSchema } from "@/lib/media/validation";
import { getServerMediaPath } from "@/lib/path/helpers";
import { PATHS } from "@/lib/path/paths";
import { prisma } from "@/lib/prisma";
import { existsPath } from "@/lib/utils/fs";
import { mkdir } from "fs/promises";
import { revalidatePath } from "next/cache";

export async function visitFolderAction(dirPath: string): Promise<void> {
  const user = await resolveCurrentUserOrThrow();
  await visitFolderByUser(dirPath, user.id);

  // ダッシュボードの履歴キャッシュをクリア
  revalidatePath(PATHS.client.dashboard.root);
}

async function visitFolderByUser(
  dirPath: string,
  userId: string
): Promise<void> {
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

export async function createFolderAction(
  parentPath: string,
  folderName: string
) {
  const validation = fsNameSchema.safeParse(folderName);

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0].message,
    };
  }

  try {
    const trimmedName = folderName.trim();

    // 仮想パスの生成 (例: /parent/path -> /parent/path/newfolder)
    const newVirtualPath =
      parentPath === "/"
        ? `/${trimmedName}`
        : `${parentPath.replace(/\/$/, "")}/${trimmedName}`;

    const newRealPath = getServerMediaPath(newVirtualPath);

    if (await existsPath(newRealPath)) {
      return {
        success: false,
        error: "同名のフォルダまたはファイルが既に存在します。",
      };
    }

    await mkdir(newRealPath, { recursive: true });
  } catch (error) {
    console.error("Create Folder Error:", error);
    return {
      success: false,
      error: "フォルダ作成中にエラーが発生しました。",
    };
  }

  // キャッシュの更新
  revalidatePath("/explorer");

  return {
    success: true,
  };
}
