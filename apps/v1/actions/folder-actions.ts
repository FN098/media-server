"use server";

import { resolveCurrentUserOrThrow } from "@/lib/auth/resolver";
import { getMimetype } from "@/lib/media/mimetype";
import { fsNameSchema } from "@/lib/media/validation";
import { getServerMediaPath } from "@/lib/path/helpers";
import { prisma } from "@/lib/prisma";
import { existsPath } from "@/lib/utils/fs";
import { updateVisitedFolder } from "@/repositories/folder-repository";
import { mkdir } from "fs/promises";
import { revalidatePath } from "next/cache";

// フォルダ訪問履歴更新
export async function visitFolderAction(dirPath: string): Promise<void> {
  const user = await resolveCurrentUserOrThrow();
  await updateVisitedFolder(dirPath, user.id);

  // キャッシュの更新
  revalidatePath("/dashboard");
}

// フォルダ作成
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

    // キャッシュの更新
    revalidatePath("/explorer");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Create Folder Error:", error);
    return {
      success: false,
      error: "フォルダ作成中にエラーが発生しました。",
    };
  }
}

// フォルダにプレビュー画像パスを設定
export async function updateFolderPreviewAction(
  virtualPath: string,
  previewPath: string
) {
  try {
    // プレビュー対象のファイル形式（MIMEタイプ）をチェック
    const mimeType = getMimetype(previewPath);
    const isImage = mimeType.startsWith("image/");
    const isVideo = mimeType.startsWith("video/");

    if (!isImage && !isVideo) {
      return {
        success: false,
        error:
          "プレビューには画像または動画ファイルのみ指定可能です。またはサポートされない形式です。",
      };
    }

    // フォルダ本体の存在確認
    const realFolderPath = getServerMediaPath(virtualPath);
    if (!(await existsPath(realFolderPath))) {
      return {
        success: false,
        error: "対象のフォルダが見つかりません。",
      };
    }

    // プレビュー用ファイルの存在確認
    const realPreviewPath = getServerMediaPath(previewPath);
    if (!(await existsPath(realPreviewPath))) {
      return {
        success: false,
        error: "指定されたプレビューファイルが存在しません。",
      };
    }

    // DB更新 (upsert)
    await prisma.folderMeta.upsert({
      where: {
        path: virtualPath,
      },
      update: {
        previewPath: previewPath,
      },
      create: {
        path: virtualPath,
        previewPath: previewPath,
      },
    });

    // キャッシュの更新
    revalidatePath("/explorer");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Update Folder Preview Error:", error);
    return {
      success: false,
      error: "プレビューの設定中にデータベースエラーが発生しました。",
    };
  }
}
