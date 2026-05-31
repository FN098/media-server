"use server";

import { prisma } from "@/lib/db/prisma";
import { detectMediaType } from "@/lib/media/detectors";
import {
  getServerMediaPath,
  getServerMediaThumbPath,
  getServerMediaTrashPath,
} from "@/lib/path/helpers";
import { PathSchema, PathSegmentSchema } from "@/lib/path/schemas";
import {
  getPathInfo,
  isFsNotFoundError,
  isFsPermissionError,
  recursiveMergeMove,
} from "@/lib/utils/fs";
import { Dirent } from "fs";
import { cp, lstat, mkdir, readdir, rename, rm } from "fs/promises";
import { revalidatePath } from "next/cache";
import { basename, dirname, extname, join } from "path";

function normalizeVirtualPath(path: string) {
  return PathSchema.parse(path);
}

function normalizeVirtualPaths(paths: string[]) {
  return paths.map((path) => PathSchema.parse(path));
}

function normalizeVirtualPathSegment(segment: string) {
  return PathSegmentSchema.parse(segment);
}

// リネーム
export async function renameNodeAction(sourcePath: string, newName: string) {
  // 入力バリデーション+正規化
  const normalizedSourcePath = normalizeVirtualPath(sourcePath);
  const normalizedNewName = normalizeVirtualPathSegment(newName);

  const srcVirtualPath = normalizedSourcePath;
  const destVirtualPath = join(dirname(srcVirtualPath), normalizedNewName);

  // 仮想パス→物理パス
  const srcRealPath = getServerMediaPath(srcVirtualPath);
  const destRealPath = getServerMediaPath(destVirtualPath);

  // ディレクトリ判定
  const srcPathInfo = await getPathInfo(srcRealPath);
  if (!srcPathInfo.exists) {
    if (srcPathInfo.error === "not-found")
      return {
        success: false,
        error: `ファイルまたはディレクトリが存在しません。: ${srcVirtualPath}`,
      };
    else
      return {
        success: false,
        error: `ファイルまたはディレクトリへのアクセスが拒否されました。: ${srcVirtualPath}`,
      };
  }
  const isDirectory = srcPathInfo.isDirectory;

  // 存在確認
  const destPathInfo = await getPathInfo(destRealPath);
  if (destPathInfo.exists) {
    return {
      success: false,
      error: `同名のファイルまたはディレクトリが既に存在します。: ${destVirtualPath}`,
    };
  }

  // リネーム先が not found の場合は処理継続、それ以外は失敗
  if (destPathInfo.error !== "not-found") {
    return {
      success: false,
      error: `ファイルまたはディレクトリへのアクセスが拒否されました。: ${destVirtualPath}`,
    };
  }

  const srcThumbPath = getServerMediaThumbPath(srcVirtualPath, isDirectory);
  const destThumbPath = getServerMediaThumbPath(destVirtualPath, isDirectory);

  // サムネイルリネーム前処理（リネーム先の古い残骸をファイル・フォルダ問わずお掃除）
  try {
    await rm(destThumbPath, { recursive: true, force: true });
  } catch (e) {
    console.error("failed to remove thumbnails directory:", e);
    return {
      success: false,
      error: "サムネイル処理中にエラーが発生しました。",
    };
  }

  // サムネイルリネーム
  let thumbRenamed = false;
  try {
    await rename(srcThumbPath, destThumbPath);
    thumbRenamed = true;
  } catch (e) {
    // サムネイル元が not found （未作成）の場合は処理継続、それ以外は失敗
    if (!isFsNotFoundError(e)) {
      console.error("failed to rename thumbnails directory:", e);
      return {
        success: false,
        error: "サムネイル処理中にエラーが発生しました。",
      };
    }
  }

  // FSリネーム
  try {
    await rename(srcRealPath, destRealPath);
  } catch (e) {
    console.error("failed to rename file or directory:", e);

    // サムネイルロールバック
    if (thumbRenamed) {
      try {
        await rename(destThumbPath, srcThumbPath);
      } catch (e) {
        console.error("failed to rollback renamed thumbnails directory:", e);
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
  } catch (e) {
    console.error("failed to update database:", e);

    // FSロールバック
    try {
      await rename(destRealPath, srcRealPath);
    } catch (err) {
      console.error("failed to rollback renamed file or directory:", err);
    }

    // サムネイルロールバック
    if (thumbRenamed) {
      try {
        await rename(destThumbPath, srcThumbPath);
      } catch (err) {
        console.error("failed to rollback renamed thumbnails directory:", err);
      }
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
  // 入力バリデーション+正規化
  const normalizedSourcePaths = normalizeVirtualPaths(sourcePaths);
  const normalizedDestDirPath = normalizeVirtualPath(destDirPath);

  const results = { success: 0, failed: 0, errors: [] as string[] };

  // ディレクトリ内のエントリ名一覧を取得（後続の自動連番で使う）
  const readDestDirPath = getServerMediaPath(normalizedDestDirPath);
  const existingNames = new Set<string>();
  try {
    const existingFiles = await readdir(readDestDirPath);
    existingFiles.forEach((name) => existingNames.add(name));
  } catch (e) {
    console.error("failed to read directory:", e);
    return {
      success: 0,
      failed: sourcePaths.length,
      errors: ["移動先フォルダの読み込みに失敗しました"],
    };
  }

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

    // ディレクトリ判定
    const srcRealPath = getServerMediaPath(srcVirtualPath);
    const srcPathInfo = await getPathInfo(srcRealPath);
    if (!srcPathInfo.exists) {
      if (srcPathInfo.error === "not-found")
        return {
          success: false,
          error: `ファイルまたはディレクトリが存在しません。: ${srcVirtualPath}`,
        };
      else
        return {
          success: false,
          error: `ファイルまたはディレクトリへのアクセスが拒否されました。: ${srcVirtualPath}`,
        };
    }
    const isDirectory = srcPathInfo.isDirectory;

    const srcName = srcVirtualPath.split("/").pop() || "";

    // 新しい名前を確定（名前衝突があれば (1), (2), ... などの連番を付与）
    let currentSrcName = srcName;
    let counter = 1;
    while (existingNames.has(currentSrcName)) {
      if (isDirectory) {
        // フォルダの場合: 「フォルダ名 (1)」
        currentSrcName = `${srcName} (${counter})`;
      } else {
        // ファイルの場合: 「ファイル名 (1).ext」
        const ext = extname(srcName);
        const base = basename(srcName, ext);
        currentSrcName = `${base} (${counter})${ext}`;
      }
      counter++;
    }

    // 次のループのファイルがこれと衝突するのを防ぐため、確定した名前を Set に予約登録
    existingNames.add(currentSrcName);

    // 最終的なパスを決定
    const destVirtualPath =
      normalizedDestDirPath === ""
        ? currentSrcName
        : `${normalizedDestDirPath}/${currentSrcName}`;
    const destRealPath = getServerMediaPath(destVirtualPath);

    const srcThumbPath = getServerMediaThumbPath(srcVirtualPath, isDirectory);
    const destThumbPath = getServerMediaThumbPath(destVirtualPath, isDirectory);

    // サムネイルリネーム前処理（リネーム先の古い残骸をファイル・フォルダ問わずお掃除）
    let thumbMoved = false;
    try {
      await rm(destThumbPath, { recursive: true, force: true });
    } catch (e) {
      console.error("failed to remove thumbnails directory:", e);
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
      // サムネイル元が not found （未作成）の場合は処理継続、それ以外は失敗
      if (!isFsNotFoundError(e)) {
        console.error("failed to rename thumbnails directory:", e);
        results.failed++;
        results.errors.push(
          `サムネイル処理中にエラーが発生しました: ${basename(srcVirtualPath)}`
        );
        continue;
      }
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
        } catch (e) {
          console.error("failed to rollback renamed thumbnails directory:", e);
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
    } catch (e) {
      console.error("failed to update database:", e);

      // FSロールバック
      try {
        await rename(destRealPath, srcRealPath);
      } catch (err) {
        console.error("failed to rollback renamed file or directory:", err);
      }

      // サムネイルロールバック
      if (thumbMoved) {
        try {
          await rename(destThumbPath, srcThumbPath);
        } catch (err) {
          console.error(
            "failed to rollback renamed thumbnails directory:",
            err
          );
        }
      }

      results.failed++;
      results.errors.push("DB更新中にエラーが発生しました。");
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
  // 入力バリデーション+正規化
  const normalizedSourcePaths = normalizeVirtualPaths(sourcePaths);
  const normalizedDestDirPath = normalizeVirtualPath(destDirPath);

  const results = { success: 0, failed: 0, errors: [] as string[] };

  // ディレクトリ内のエントリ名一覧を取得（後続の自動連番で使う）
  const destLocalRootPath = getServerMediaPath(normalizedDestDirPath);
  const existingNames = new Set<string>();
  try {
    const files = await readdir(destLocalRootPath);
    files.forEach((name) => existingNames.add(name));
  } catch (e) {
    // コピー先フォルダ自体が存在しないなどのエラーハンドリング
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
      return {
        success: 0,
        failed: sourcePaths.length,
        errors: ["コピー先フォルダの読み込みに失敗しました"],
      };
    }
  }

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

    // ディレクトリ判定
    const srcRealPath = getServerMediaPath(srcVirtualPath);
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
    const srcName = srcVirtualPath.split("/").pop() || "";

    // 新しい名前を確定
    let currentSrcName = srcName;
    let counter = 1;

    while (existingNames.has(currentSrcName)) {
      if (isDirectory) {
        // フォルダの場合: 「フォルダ名 (1)」
        currentSrcName = `${srcName} (${counter})`;
      } else {
        // ファイルの場合: 「ファイル名 (1).ext」
        const ext = extname(srcName);
        const base = basename(srcName, ext);
        currentSrcName = `${base} (${counter})${ext}`;
      }
      counter++;
    }

    // 次のループのファイルがこれと衝突するのを防ぐため、確定した名前を Set に予約登録
    existingNames.add(currentSrcName);

    // 最終的なパスを決定
    const destVirtualPath =
      normalizedDestDirPath === ""
        ? currentSrcName
        : `${normalizedDestDirPath}/${currentSrcName}`;
    const destRealPath = getServerMediaPath(destVirtualPath);

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

    // FSコピー
    try {
      await cp(srcRealPath, destRealPath, { recursive: isDirectory });
    } catch (e) {
      console.error(`File Copy Error [${srcVirtualPath}]:`, e);

      // FSロールバック（中途半端なコピー結果を削除）
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

    // NOTE: DB 登録はしない（新規として扱う）
    results.success++;
  }

  // キャッシュの更新
  revalidatePath("/explorer");

  return results;
}

// メディアファイル一覧
export async function listMediaAction(dirPath: string) {
  // 入力バリデーション+正規化
  const virtualDirPath = normalizeVirtualPath(dirPath);

  // 仮想パス→物理パス
  const realDirPath = getServerMediaPath(virtualDirPath);

  let entries: Dirent[];
  try {
    entries = await readdir(realDirPath, { withFileTypes: true });
  } catch (e) {
    if (isFsNotFoundError(e)) {
      return { success: false, error: "フォルダが見つかりません" };
    }
    if (isFsPermissionError(e)) {
      return { success: false, error: "フォルダへのアクセス権がありません" };
    }
    console.error(`Sub Directories Error [${virtualDirPath}]:`, e);
    return { success: false, error: "ファイル一覧の取得に失敗しました" };
  }

  const mediaFiles = entries
    .filter((e) => e.isFile()) // ファイルのみ対象
    .map((e) => {
      const type = detectMediaType(e.name);
      if (type === null) return null;
      return {
        name: e.name,
        // 仮想パスを生成
        path: join(virtualDirPath, e.name).replace(/\\/g, "/"),
        type,
      };
    })
    .filter((e) => e !== null);

  return {
    success: true,
    files: mediaFiles,
  };
}

// 削除（ゴミ箱フォルダへの移動）
export async function deleteNodesAction(sourcePaths: string[]) {
  // 入力バリデーション+正規化
  const normalizedSourcePaths = normalizeVirtualPaths(sourcePaths);

  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const srcVirtualPath of normalizedSourcePaths) {
    const destVirtualPath = srcVirtualPath;

    // 仮想パス→物理パス
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

// 復元（ゴミ箱フォルダから元のフォルダへの移動）
export async function restoreNodesAction(sourcePaths: string[]) {
  // 入力バリデーション+正規化
  const normalizedSourcePaths = normalizeVirtualPaths(sourcePaths);

  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const srcVirtualPath of normalizedSourcePaths) {
    const destVirtualPath = srcVirtualPath;

    // 仮想パス→物理パス
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

// 完全に削除
export async function deleteNodesPermanentlyAction(sourcePaths: string[]) {
  // 入力バリデーション+正規化
  const normalizedSourcePaths = normalizeVirtualPaths(sourcePaths);

  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const virtualPath of normalizedSourcePaths) {
    // 仮想パス→物理パス
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

// タイムスタンプ更新
export async function touchMediaTimestampAction(targetPath: string) {
  // 入力バリデーション+正規化
  const virtualPath = normalizeVirtualPath(targetPath);

  // 実ファイルのタイムスタンプは utime や open->close では更新されないので無視
  try {
    await prisma.media.update({
      where: { path: virtualPath },
      data: { fileMtime: new Date() },
    });
  } catch (error) {
    console.error("Touch Media Timestamp Error:", error);
    return { success: false, error: "タイムスタンプの更新に失敗しました。" };
  }

  return { success: true };
}
