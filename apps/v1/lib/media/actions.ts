"use server";

import { getMimetype } from "@/lib/media/mimetype";
import { FsNameSchema } from "@/lib/media/schemas";
import {
  getServerMediaPath,
  getServerMediaThumbPath,
  getServerMediaTrashPath,
} from "@/lib/path/helpers";
import { prisma } from "@/lib/prisma";
import { existsPath, recursiveMergeMove } from "@/lib/utils/fs";
import { Dirent } from "fs";
import { cp, lstat, mkdir, readdir, rename, rm } from "fs/promises";
import { revalidatePath } from "next/cache";
import { basename, dirname, join } from "path";

// リネーム
export async function renameNodeAction(sourcePath: string, newName: string) {
  // 正規化
  const normalizedSourcePath = sourcePath.replace(/^\/+/, "");
  if (normalizedSourcePath === "") {
    return {
      success: false,
      error: "ルートディレクトリはリネームできません。",
    };
  }

  // バリデーション
  const validation = FsNameSchema.safeParse(newName);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0].message,
    };
  }

  const srcVirtualPath = normalizedSourcePath;
  const destVirtualPath = join(dirname(srcVirtualPath), newName.trim()).replace(
    /\\/g,
    "/"
  );

  const srcRealPath = getServerMediaPath(srcVirtualPath);
  const destRealPath = getServerMediaPath(destVirtualPath);

  // 存在確認
  if (await existsPath(destRealPath)) {
    return {
      success: false,
      error: `同名の項目が既に存在します。: ${basename(destRealPath)}`,
    };
  }

  let stats: Awaited<ReturnType<typeof lstat>>;
  try {
    stats = await lstat(srcRealPath);
  } catch {
    return {
      success: false,
      error: `移動元が見つかりません: ${basename(srcVirtualPath)}`,
    };
  }
  const isDirectory = stats.isDirectory();

  const srcThumbPath = getServerMediaThumbPath(srcVirtualPath, isDirectory);
  const destThumbPath = getServerMediaThumbPath(destVirtualPath, isDirectory);

  // サムネイルリネーム
  let thumbRenamed = false;
  try {
    if (isDirectory) {
      await rm(destThumbPath, { recursive: true, force: true });
    }
  } catch (e) {
    console.error("Thumbnail Dir Remove Error:", e);
    return {
      success: false,
      error: "サムネイル処理中にエラーが発生しました。",
    };
  }

  try {
    await rename(srcThumbPath, destThumbPath);
    thumbRenamed = true;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("Thumbnail Rename Error:", e);
      return {
        success: false,
        error: "サムネイル処理中にエラーが発生しました。",
      };
    }
    // ENOENT はスキップ
  }

  // FS更新
  try {
    await rename(srcRealPath, destRealPath);
  } catch (e) {
    console.error("File Rename Error:", e);

    // サムネイルロールバック
    if (thumbRenamed) {
      try {
        await rename(destThumbPath, srcThumbPath);
      } catch (e) {
        console.error("Thumbnail Rollback Error:", e);
      }
    }

    return {
      success: false,
      error: "ファイルリネーム中にエラーが発生しました。",
    };
  }

  // DB更新
  try {
    await prisma.$transaction(async (tx) => {
      // 自分自身の更新
      await tx.$executeRaw`
        UPDATE Media 
        SET path = ${destVirtualPath}
        WHERE path = ${srcVirtualPath}
      `;

      // 配下の更新
      if (isDirectory) {
        await tx.$executeRaw`
          UPDATE Media 
          SET 
            path = REPLACE(path, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/')),
            dirPath = CASE 
              WHEN dirPath = ${srcVirtualPath} THEN ${destVirtualPath}
              ELSE REPLACE(dirPath, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/'))
            END
          WHERE path LIKE CONCAT(${srcVirtualPath}, '/%')
        `;
      }

      // 訪問履歴の更新
      await tx.$executeRaw`
        DELETE FROM VisitedFolder
        WHERE (
          dirPath = ${destVirtualPath}
          OR dirPath LIKE CONCAT(${destVirtualPath}, '/%')
        )
        AND (
          dirPath != ${srcVirtualPath}
          AND dirPath NOT LIKE CONCAT(${srcVirtualPath}, '/%')
        )
      `;

      await tx.$executeRaw`
        UPDATE VisitedFolder 
        SET dirPath = CASE 
          WHEN dirPath = ${srcVirtualPath} THEN ${destVirtualPath}
          ELSE REPLACE(dirPath, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/'))
        END
        WHERE dirPath = ${srcVirtualPath} OR dirPath LIKE CONCAT(${srcVirtualPath}, '/%')
      `;

      // プレビューの更新（フォルダ）
      if (isDirectory) {
        // リネーム先の重複を削除（上書き許容）
        await tx.$executeRaw`
          DELETE FROM FolderMeta 
          WHERE path = ${destVirtualPath} OR path LIKE CONCAT(${destVirtualPath}, '/%')
        `;

        // path と previewPath を一括置換
        await tx.$executeRaw`
          UPDATE FolderMeta
          SET 
            path = CASE 
              WHEN path = ${srcVirtualPath} THEN ${destVirtualPath}
              ELSE REPLACE(path, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/'))
            END,
            previewPath = CASE
              WHEN previewPath IS NULL THEN NULL
              WHEN previewPath = ${srcVirtualPath} THEN ${destVirtualPath}
              WHEN previewPath LIKE CONCAT(${srcVirtualPath}, '/%') 
                THEN REPLACE(previewPath, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/'))
              ELSE previewPath
            END
          WHERE path = ${srcVirtualPath} OR path LIKE CONCAT(${srcVirtualPath}, '/%')
        `;
      } else {
        // ファイル単体のリネームの場合
        await tx.$executeRaw`
          UPDATE FolderMeta SET previewPath = ${destVirtualPath} WHERE previewPath = ${srcVirtualPath}
        `;
      }

      // プレビューの更新（メディア）
      if (isDirectory) {
        await tx.$executeRaw`
          UPDATE Media
          SET previewPath = CASE
            WHEN previewPath = ${srcVirtualPath} THEN ${destVirtualPath}
            WHEN previewPath LIKE CONCAT(${srcVirtualPath}, '/%')
              THEN REPLACE(previewPath, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/'))
            ELSE previewPath
          END
          WHERE previewPath = ${srcVirtualPath} OR previewPath LIKE CONCAT(${srcVirtualPath}, '/%')
        `;
      } else {
        await tx.$executeRaw`
          UPDATE Media SET previewPath = ${destVirtualPath} WHERE previewPath = ${srcVirtualPath}
        `;
      }
    });
  } catch (error) {
    console.error("DB Rename Error:", error);

    // FSロールバック
    try {
      await rename(destRealPath, srcRealPath);
    } catch (e) {
      console.error("File Rollback Error:", e);
    }

    // サムネイルロールバック
    try {
      await rename(destThumbPath, srcThumbPath);
    } catch (e) {
      console.error("Thumbnail Rollback Error:", e);
    }

    return {
      success: false,
      error: "DB更新中にエラーが発生しました。",
    };
  }

  // キャッシュの更新
  revalidatePath("/explorer");

  return {
    success: true,
  };
}

// 移動
export async function moveNodesAction(
  sourcePaths: string[],
  destDirPath: string
) {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  // 正規化
  const normalizedDestDirPath = destDirPath.replace(/^\//, "");
  const normalizedSourcePaths = sourcePaths.map((path) =>
    path.replace(/^\//, "")
  );

  for (const srcVirtualPath of normalizedSourcePaths) {
    // 子孫チェック
    if (
      normalizedDestDirPath === srcVirtualPath ||
      normalizedDestDirPath.startsWith(srcVirtualPath + "/")
    ) {
      results.failed++;
      results.errors.push(
        `自分自身またはサブフォルダへの操作はできません: ${basename(srcVirtualPath)}`
      );
      continue;
    }

    const srcName = srcVirtualPath.split("/").pop() || "";
    const destVirtualPath =
      normalizedDestDirPath === ""
        ? srcName
        : `${normalizedDestDirPath}/${srcName}`;

    const srcRealPath = getServerMediaPath(srcVirtualPath);
    const destRealPath = getServerMediaPath(destVirtualPath);

    // 存在確認
    if (await existsPath(destRealPath)) {
      results.failed++;
      results.errors.push(
        `移動先に同名の項目が存在します: ${basename(destRealPath)}`
      );
      continue;
    }

    // ディレクトリ判定
    let stats: Awaited<ReturnType<typeof lstat>>;
    try {
      stats = await lstat(srcRealPath);
    } catch {
      results.failed++;
      results.errors.push(
        `移動元が見つかりません: ${basename(srcVirtualPath)}`
      );
      continue;
    }
    const isDirectory = stats.isDirectory();

    const srcThumbPath = getServerMediaThumbPath(srcVirtualPath, isDirectory);
    const destThumbPath = getServerMediaThumbPath(destVirtualPath, isDirectory);

    // サムネイル移動前処理（移動対象がフォルダなら先に移動先の同名フォルダを削除しておく）
    let thumbMoved = false;
    try {
      if (isDirectory) {
        await rm(destThumbPath, { recursive: true, force: true });
      }
    } catch (e) {
      console.error(`Thumbnail Dir Remove Error [${srcVirtualPath}]:`, e);
      results.failed++;
      results.errors.push(
        `サムネイル処理中にエラーが発生しました: ${basename(srcVirtualPath)}`
      );
      continue;
    }

    // サムネイル移動
    try {
      await rename(srcThumbPath, destThumbPath);
      thumbMoved = true;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error(`Thumbnail Rename Error [${srcVirtualPath}]:`, e);
        results.failed++;
        results.errors.push(
          `サムネイル処理中にエラーが発生しました: ${basename(srcVirtualPath)}`
        );
        continue;
      }
      // ENOENT はスキップ（サムネイル未生成）
    }

    // FS移動
    try {
      await rename(srcRealPath, destRealPath);
    } catch (e) {
      console.error(`File Move Error [${srcVirtualPath}]:`, e);

      // サムネイルロールバック
      if (thumbMoved) {
        try {
          await rename(destThumbPath, srcThumbPath);
        } catch (re) {
          console.error(`Thumbnail Rollback Error [${srcVirtualPath}]:`, re);
        }
      }

      results.failed++;
      results.errors.push(
        `ファイル移動中にエラーが発生しました: ${basename(srcVirtualPath)}`
      );
      continue;
    }

    // DB更新
    try {
      await prisma.$transaction(async (tx) => {
        // 自分自身の更新
        await tx.$executeRaw`
          UPDATE Media SET 
            path = ${destVirtualPath}, 
            dirPath = ${normalizedDestDirPath} 
          WHERE path = ${srcVirtualPath}
        `;

        // 配下の更新
        if (isDirectory) {
          await tx.$executeRaw`
            UPDATE Media SET 
              path = REPLACE(path, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/')),
              dirPath = CASE 
                WHEN dirPath = ${srcVirtualPath} THEN ${destVirtualPath}
                ELSE REPLACE(dirPath, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/'))
              END
            WHERE path LIKE CONCAT(${srcVirtualPath}, '/%')
          `;
        }

        // 訪問履歴の更新
        await tx.$executeRaw`
          DELETE FROM VisitedFolder
          WHERE (
            dirPath = ${destVirtualPath}
            OR dirPath LIKE CONCAT(${destVirtualPath}, '/%')
          )
          AND (
            dirPath != ${srcVirtualPath}
            AND dirPath NOT LIKE CONCAT(${srcVirtualPath}, '/%')
          )
        `;

        await tx.$executeRaw`
          UPDATE VisitedFolder 
          SET dirPath = CASE 
            WHEN dirPath = ${srcVirtualPath} THEN ${destVirtualPath}
            ELSE REPLACE(dirPath, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/'))
          END
          WHERE dirPath = ${srcVirtualPath} OR dirPath LIKE CONCAT(${srcVirtualPath}, '/%')
        `;

        // プレビューの更新（フォルダ）
        if (isDirectory) {
          // リネーム先の重複を削除（上書き許容）
          await tx.$executeRaw`
            DELETE FROM FolderMeta 
            WHERE path = ${destVirtualPath} OR path LIKE CONCAT(${destVirtualPath}, '/%')
          `;

          // path と previewPath を一括置換
          await tx.$executeRaw`
            UPDATE FolderMeta
            SET 
              path = CASE 
                WHEN path = ${srcVirtualPath} THEN ${destVirtualPath}
                ELSE REPLACE(path, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/'))
              END,
              previewPath = CASE
                WHEN previewPath IS NULL THEN NULL
                WHEN previewPath = ${srcVirtualPath} THEN ${destVirtualPath}
                WHEN previewPath LIKE CONCAT(${srcVirtualPath}, '/%') 
                  THEN REPLACE(previewPath, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/'))
                ELSE previewPath
              END
            WHERE path = ${srcVirtualPath} OR path LIKE CONCAT(${srcVirtualPath}, '/%')
          `;
        } else {
          // ファイル単体の移動の場合
          await tx.$executeRaw`
            UPDATE FolderMeta SET previewPath = ${destVirtualPath} WHERE previewPath = ${srcVirtualPath}
          `;
        }

        // プレビューの更新（メディア）
        if (isDirectory) {
          await tx.$executeRaw`
            UPDATE Media
            SET previewPath = CASE
              WHEN previewPath = ${srcVirtualPath} THEN ${destVirtualPath}
              WHEN previewPath LIKE CONCAT(${srcVirtualPath}, '/%')
                THEN REPLACE(previewPath, CONCAT(${srcVirtualPath}, '/'), CONCAT(${destVirtualPath}, '/'))
              ELSE previewPath
            END
            WHERE previewPath = ${srcVirtualPath} OR previewPath LIKE CONCAT(${srcVirtualPath}, '/%')
          `;
        } else {
          await tx.$executeRaw`
            UPDATE Media SET previewPath = ${destVirtualPath} WHERE previewPath = ${srcVirtualPath}
          `;
        }
      });
    } catch (error) {
      console.error(`DB Move Error [${srcVirtualPath}]:`, error);

      // FSロールバック
      try {
        await rename(destRealPath, srcRealPath);
      } catch (re) {
        console.error(`File Rollback Error [${srcVirtualPath}]:`, re);
      }

      // サムネイルロールバック
      if (thumbMoved) {
        try {
          await rename(destThumbPath, srcThumbPath);
        } catch (re) {
          console.error(`Thumbnail Rollback Error [${srcVirtualPath}]:`, re);
        }
      }

      results.failed++;
      results.errors.push(
        `DB更新中にエラーが発生しました: ${basename(srcVirtualPath)}`
      );
      continue;
    }

    results.success++;
  }

  // キャッシュの更新
  revalidatePath("/explorer");

  return results;
}

// コピー
export async function copyNodesAction(
  sourcePaths: string[],
  destDirPath: string
) {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  // 正規化
  const normalizedDestDirPath = destDirPath.replace(/^\//, "");
  const normalizedSourcePaths = sourcePaths.map((path) =>
    path.replace(/^\//, "")
  );

  for (const srcVirtualPath of normalizedSourcePaths) {
    // 子孫チェック
    if (
      normalizedDestDirPath === srcVirtualPath ||
      normalizedDestDirPath.startsWith(srcVirtualPath + "/")
    ) {
      results.failed++;
      results.errors.push(
        `自分自身またはサブフォルダへの操作はできません: ${basename(srcVirtualPath)}`
      );
      continue;
    }

    const srcName = srcVirtualPath.split("/").pop() || "";
    const destVirtualPath =
      normalizedDestDirPath === ""
        ? srcName
        : `${normalizedDestDirPath}/${srcName}`;

    const srcRealPath = getServerMediaPath(srcVirtualPath);
    const destRealPath = getServerMediaPath(destVirtualPath);

    // 存在確認
    if (await existsPath(destRealPath)) {
      results.failed++;
      results.errors.push(
        `コピー先に同名の項目が存在します: ${basename(destRealPath)}`
      );
      continue;
    }

    // ディレクトリ判定
    let stats: Awaited<ReturnType<typeof lstat>>;
    try {
      stats = await lstat(srcRealPath);
    } catch {
      results.failed++;
      results.errors.push(
        `コピー元が見つかりません: ${basename(srcVirtualPath)}`
      );
      continue;
    }
    const isDirectory = stats.isDirectory();

    // FSコピー
    try {
      await cp(srcRealPath, destRealPath, { recursive: isDirectory });
    } catch (e) {
      console.error(`File Copy Error [${srcVirtualPath}]:`, e);

      // ロールバック（中途半端なコピー結果を削除）
      try {
        await rm(destRealPath, { recursive: true, force: true });
      } catch (re) {
        console.error(`File Rollback Error [${srcVirtualPath}]:`, re);
      }

      results.failed++;
      results.errors.push(
        `ファイルコピー中にエラーが発生しました: ${basename(srcVirtualPath)}`
      );
      continue;
    }

    // サムネイルコピー（失敗しても本体コピーは続行）
    const srcThumbPath = getServerMediaThumbPath(srcVirtualPath, isDirectory);
    const destThumbPath = getServerMediaThumbPath(destVirtualPath, isDirectory);
    try {
      await cp(srcThumbPath, destThumbPath, { recursive: isDirectory });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
        // ENOENT 以外は警告ログだけ残す（本体コピーは成功しているので続行）
        console.error(`Thumbnail Copy Error [${srcVirtualPath}]:`, e);
      }
    }

    // NOTE: DB 登録はしない（新規として扱う）
    results.success++;
  }

  // キャッシュの更新
  revalidatePath("/explorer");

  return results;
}

// フォルダプレビュー用ファイル一覧
export async function getFolderMediaFilesAction(dirPath: string) {
  if (!dirPath) {
    return { success: false, error: "パスが指定されていません" };
  }

  const realPath = getServerMediaPath(dirPath);

  let entries: Dirent[];
  try {
    entries = await readdir(realPath, { withFileTypes: true });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return { success: false, error: "フォルダが見つかりません" };
    }
    if ((e as NodeJS.ErrnoException).code === "EACCES") {
      return { success: false, error: "フォルダへのアクセス権がありません" };
    }
    console.error(`Sub Directories Error [${dirPath}]:`, e);
    return { success: false, error: "ファイル一覧の取得に失敗しました" };
  }

  const mediaFiles = entries
    .filter((e) => e.isFile()) // ファイルのみ対象
    .filter((e) => {
      const mimeType = getMimetype(e.name);
      return (
        mimeType.startsWith("image/") ||
        mimeType.startsWith("video/") ||
        mimeType.startsWith("audio/")
      );
    })
    .map((e) => ({
      name: e.name,
      // 仮想パスを生成
      path: join(dirPath, e.name).replace(/\\/g, "/"),
      type: getMimetype(e.name).startsWith("video/") ? "video" : "image",
    }));

  return {
    success: true,
    files: mediaFiles,
  };
}

// 削除（ゴミ箱フォルダへの移動）
export async function deleteNodesAction(sourcePaths: string[]) {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const srcVirtualPath of sourcePaths) {
    const destVirtualPath = srcVirtualPath;

    const srcRealPath = getServerMediaPath(srcVirtualPath);
    const destRealPath = getServerMediaTrashPath(destVirtualPath);

    // 移動先フォルダ作成
    try {
      await mkdir(dirname(destRealPath), { recursive: true });
    } catch (e) {
      console.error(`Directory Create Error [${destRealPath}]:`, e);
      results.failed++;
      results.errors.push(
        `フォルダ処理中にエラーが発生しました: ${basename(srcVirtualPath)}`
      );
      continue;
    }

    // FS移動
    try {
      await recursiveMergeMove(srcRealPath, destRealPath);
    } catch (e) {
      console.error(`File Move Error [${srcVirtualPath}]:`, e);
      results.failed++;
      results.errors.push(
        `削除中にエラーが発生しました: ${basename(srcVirtualPath)}`
      );
      continue;
    }

    // NOTE: DB削除はしない（フォルダ同期時に自動削除）
    results.success++;
  }

  // キャッシュの更新
  revalidatePath("/explorer");
  revalidatePath("/trash");

  return results;
}

// 完全に削除
export async function deleteNodesPermanentlyAction(sourcePaths: string[]) {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const virtualPath of sourcePaths) {
    const realPath = getServerMediaTrashPath(virtualPath);

    // FS削除
    try {
      await rm(realPath, { recursive: true, force: true });
    } catch (error) {
      console.error(`Permanent Delete Error [${virtualPath}]:`, error);
      results.failed++;
      results.errors.push(
        `削除中にエラーが発生しました: ${basename(virtualPath)}`
      );
      continue;
    }

    // NOTE: DB削除はしない（フォルダ同期時に自動削除）
    results.success++;
  }

  // キャッシュの更新
  revalidatePath("/trash");

  return results;
}

// 復元（ゴミ箱フォルダから元のフォルダへの移動）
export async function restoreNodesAction(sourcePaths: string[]) {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const srcVirtualPath of sourcePaths) {
    const destVirtualPath = srcVirtualPath;

    const srcRealPath = getServerMediaTrashPath(srcVirtualPath);
    const destRealPath = getServerMediaPath(destVirtualPath);

    // 移動先フォルダ作成
    try {
      await mkdir(dirname(destRealPath), { recursive: true });
    } catch (e) {
      console.error(`Directory Create Error [${destRealPath}]:`, e);
      results.failed++;
      results.errors.push(
        `フォルダ処理中にエラーが発生しました: ${basename(srcVirtualPath)}`
      );
      continue;
    }

    // FS移動
    try {
      await recursiveMergeMove(srcRealPath, destRealPath);
    } catch (e) {
      console.error(`File Move Error [${srcVirtualPath}]:`, e);
      results.failed++;
      results.errors.push(
        `復元中にエラーが発生しました: ${basename(srcVirtualPath)}`
      );
      continue;
    }

    results.success++;
  }

  // キャッシュの更新
  revalidatePath("/explorer");
  revalidatePath("/trash");

  return results;
}

// タイムスタンプ更新
export async function touchMediaTimestampAction(targetPath: string) {
  // 実ファイルのタイムスタンプは utime や open->close では更新されないので無視
  try {
    await prisma.media.update({
      where: { path: targetPath },
      data: { fileMtime: new Date() },
    });
  } catch (error) {
    console.error("Touch Media Timestamp Error:", error);
    return { success: false, error: "タイムスタンプの更新に失敗しました。" };
  }

  return { success: true };
}
