"use server";

import {
  resolveCurrentUser,
  resolveCurrentUserOrThrow,
} from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { logger } from "@/lib/logger";
import { detectMediaType } from "@/lib/media/detectors";
import { updateMediaFileMtime } from "@/lib/media/repository";
import { copyNodeInDb, renameNodeInDb } from "@/lib/media/services";
import {
  getServerMediaPath,
  getServerMediaThumbPath,
  getServerMediaTrashPath,
} from "@/lib/path/helpers";
import { isSystemHiddenVirtualPath } from "@/lib/path/protections";
import { unique } from "@/lib/utils/array";
import {
  getPathInfo,
  isFsNotFoundError,
  isFsPermissionError,
  recursiveMergeMove,
} from "@/lib/utils/fs";
import { isRootPath, sanitize } from "@/lib/virtual-path/guard";
import { basename, dirname, extname, join } from "@/lib/virtual-path/path";
import {
  FileOrFolderNameSchema,
  VirtualPathManySchema,
  VirtualPathOneSchema,
  VirtualPathSchema,
} from "@/lib/virtual-path/schemas";
import console from "console";
import { Dirent } from "fs";
import { cp, mkdir, readdir, rename, rm } from "fs/promises";
import { revalidatePath } from "next/cache";

function normalizeVirtualPath(path: string) {
  return VirtualPathOneSchema.parse(path);
}

type RenameNodeResult =
  | { success: true }
  | {
      success: false;
      message: string;
      code?: "duplicated";
      errors?: { prop: string; issues?: unknown[] }[];
    };

// リネーム
export async function renameNodeAction(
  sourcePath: string,
  newName: string
): Promise<RenameNodeResult> {
  // 入力バリデーション＋正規化
  if (!sourcePath || newName.length === 0) {
    return {
      success: false,
      message: "処理対象のパスまたは名前が指定されていません。",
    };
  }

  const parsed = {
    sourcePath: VirtualPathSchema.safeParse(sanitize(sourcePath)),
    newName: FileOrFolderNameSchema.safeParse(sanitize(newName)),
  };
  if (!parsed.sourcePath.success || !parsed.newName.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [
        { prop: "sourcePath", issues: parsed.sourcePath.error?.issues },
        { prop: "newName", issues: parsed.newName.error?.issues },
      ],
    };
  }

  const normalizedSourcePath = parsed.sourcePath.data;
  const normalizedNewName = parsed.newName.data;

  // ルートフォルダ保護
  if (isRootPath(normalizedSourcePath)) {
    return {
      success: false,
      message: "ルートフォルダは操作できません。",
    };
  }

  // システムフォルダ保護
  if (isSystemHiddenVirtualPath(normalizedSourcePath)) {
    return {
      success: false,
      message: "システムフォルダは操作できません。",
    };
  }

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "認証されていません。",
    };
  }

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
        message: `ファイルまたはフォルダが存在しません。: ${srcVirtualPath}`,
      };
    else
      return {
        success: false,
        message: `ファイルまたはフォルダへのアクセスが拒否されました。: ${srcVirtualPath}`,
      };
  }
  const isDirectory = srcPathInfo.isDirectory;

  // 認可
  if (
    (!isDirectory && !hasPermission(user, "file:rename")) ||
    (isDirectory && !hasPermission(user, "folder:rename"))
  ) {
    return {
      success: false,
      message: "権限がありません。",
    };
  }

  // 存在確認
  const destPathInfo = await getPathInfo(destRealPath);
  if (destPathInfo.exists) {
    return {
      success: false,
      message: `同名のファイルまたはフォルダが既に存在します。: ${destVirtualPath}`,
      code: "duplicated",
    };
  }

  // not found の場合は処理継続、それ以外は失敗
  if (destPathInfo.error !== "not-found") {
    return {
      success: false,
      message: `ファイルまたはフォルダへのアクセスが拒否されました。: ${destVirtualPath}`,
    };
  }

  const srcThumbPath = getServerMediaThumbPath(srcVirtualPath, isDirectory);
  const destThumbPath = getServerMediaThumbPath(destVirtualPath, isDirectory);

  // サムネイルリネーム前処理
  try {
    await rm(destThumbPath, { recursive: true, force: true });
  } catch (e) {
    logger.error("action:rename:thumb-preprocess", e);
    return {
      success: false,
      message: "ファイルまたはフォルダのリネームに失敗しました。",
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
      logger.error("action:rename:thumb", e);
      return {
        success: false,
        message: "ファイルまたはフォルダのリネームに失敗しました。",
      };
    }
  }

  // FSリネーム
  try {
    await rename(srcRealPath, destRealPath);
  } catch (e) {
    logger.error("action:rename:fs", e);

    // サムネイルロールバック
    if (thumbRenamed) {
      try {
        await rename(destThumbPath, srcThumbPath);
      } catch (e) {
        logger.error("action:rename:fs:thumb-rollback", e);
      }
    }

    return {
      success: false,
      message: "ファイルまたはフォルダのリネームに失敗しました。",
    };
  }

  // DB更新
  try {
    await renameNodeInDb({ srcVirtualPath, destVirtualPath, isDirectory });
  } catch (e) {
    logger.error("action:rename:db-node", e);

    // FSロールバック
    try {
      await rename(destRealPath, srcRealPath);
    } catch (e) {
      logger.error("action:rename:db:fs-rollback", e);
    }

    // サムネイルロールバック
    if (thumbRenamed) {
      try {
        await rename(destThumbPath, srcThumbPath);
      } catch (e) {
        logger.error("action:rename:db:thumb-rollback", e);
      }
    }

    return {
      success: false,
      message: "ファイルまたはフォルダのリネームに失敗しました。",
    };
  }

  // キャッシュの更新
  revalidatePath("/explorer");

  return {
    success: true,
  };
}

type MoveNodesResult =
  | {
      success: true;
      completed: { path: string }[];
      failed: { path: string; message: string }[];
      skipped: { path: string; message: string }[];
    }
  | {
      success: false;
      message: string;
      errors?: { prop: string; issues?: unknown[] }[];
    };

type MoveNodesSuccess = Extract<MoveNodesResult, { success: true }>;

// 移動
export async function moveNodesAction(
  sourcePaths: string[],
  destDirPath: string
): Promise<MoveNodesResult> {
  // 入力バリデーション＋正規化
  if (!sourcePaths || sourcePaths.length === 0 || !destDirPath) {
    return {
      success: false,
      message: "処理対象のパスが指定されていません。",
    };
  }

  const parsed = {
    sourcePaths: VirtualPathManySchema.safeParse(sourcePaths.map(sanitize)),
    destDirPath: VirtualPathOneSchema.safeParse(sanitize(destDirPath)),
  };
  if (!parsed.sourcePaths.success || !parsed.destDirPath.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [
        { prop: "sourcePaths", issues: parsed.sourcePaths.error?.issues },
        { prop: "destDirPath", issues: parsed.destDirPath.error?.issues },
      ],
    };
  }

  const normalizedSourcePaths = unique(parsed.sourcePaths.data);
  const normalizedDestDirPath = parsed.destDirPath.data;

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "認証されていません。",
    };
  }

  // 仮想パス→物理パス
  const realDestDirPath = getServerMediaPath(normalizedDestDirPath);

  // ディレクトリ内のエントリ名一覧を取得（後続の自動連番で使う）
  const existingNames = new Set<string>();
  try {
    const entries = await readdir(realDestDirPath);
    entries.forEach((name) => existingNames.add(name));
  } catch (e) {
    logger.error("action:move:read-directory", e);
    return {
      success: false,
      message: "ファイルまたはフォルダの移動に失敗しました。",
    };
  }

  const completed: MoveNodesSuccess["completed"] = [];
  const failed: MoveNodesSuccess["failed"] = [];
  const skipped: MoveNodesSuccess["skipped"] = [];

  for (const srcVirtualPath of normalizedSourcePaths) {
    // 子孫チェック
    if (
      normalizedDestDirPath === srcVirtualPath ||
      normalizedDestDirPath.startsWith(srcVirtualPath + "/")
    ) {
      skipped.push({
        path: srcVirtualPath,
        message: "自分自身またはサブフォルダへの操作はできません。",
      });
      continue;
    }

    // ルートフォルダ保護
    if (isRootPath(srcVirtualPath)) {
      skipped.push({
        path: srcVirtualPath,
        message: "ルートフォルダは操作できません。",
      });
      continue;
    }

    // システムフォルダ保護
    if (isSystemHiddenVirtualPath(srcVirtualPath)) {
      skipped.push({
        path: srcVirtualPath,
        message: "システムフォルダは操作できません。",
      });
      continue;
    }

    // 仮想パス→物理パス
    const srcRealPath = getServerMediaPath(srcVirtualPath);

    // ディレクトリ判定
    const srcPathInfo = await getPathInfo(srcRealPath);
    if (!srcPathInfo.exists) {
      if (srcPathInfo.error === "not-found") {
        failed.push({
          path: srcVirtualPath,
          message: "ファイルまたはフォルダが存在しません。",
        });
        continue;
      } else {
        failed.push({
          path: srcVirtualPath,
          message: "ファイルまたはフォルダへのアクセスが拒否されました。",
        });
        continue;
      }
    }
    const isDirectory = srcPathInfo.isDirectory;

    // 認可
    if (
      (!isDirectory && !hasPermission(user, "file:move")) ||
      (isDirectory && !hasPermission(user, "folder:move"))
    ) {
      skipped.push({
        path: srcVirtualPath,
        message: "権限がありません。",
      });
      continue;
    }

    const srcName = basename(srcVirtualPath);

    // 新しい名前を確定（名前衝突があれば (2), (3), ... などの連番を付与）
    let currentSrcName = srcName;
    let counter = 2;
    while (existingNames.has(currentSrcName)) {
      if (isDirectory) {
        // フォルダの場合: 「フォルダ名 (2)」
        currentSrcName = `${srcName} (${counter})`;
      } else {
        // ファイルの場合: 「ファイル名 (2).ext」
        const ext = extname(srcName);
        const base = basename(srcName, ext);
        currentSrcName = `${base} (${counter})${ext}`;
      }
      counter++;
    }

    // 最終的なパスを決定
    const destVirtualPath = join(normalizedDestDirPath, currentSrcName);
    const destRealPath = getServerMediaPath(destVirtualPath);

    const srcThumbPath = getServerMediaThumbPath(srcVirtualPath, isDirectory);
    const destThumbPath = getServerMediaThumbPath(destVirtualPath, isDirectory);

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
    existingNames.add(currentSrcName);
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

type CopyNodesResult =
  | {
      success: true;
      completed: { path: string }[];
      failed: { path: string; message: string }[];
      skipped: { path: string; message: string }[];
    }
  | {
      success: false;
      message: string;
      errors?: { prop: string; issues?: unknown[] }[];
    };

type CopyNodesSuccess = Extract<CopyNodesResult, { success: true }>;

// コピー
export async function copyNodesAction(
  sourcePaths: string[],
  destDirPath: string
): Promise<CopyNodesResult> {
  // 入力バリデーション＋正規化
  if (!sourcePaths || sourcePaths.length === 0 || !destDirPath) {
    return {
      success: false,
      message: "処理対象のパスが指定されていません。",
    };
  }

  const parsed = {
    sourcePaths: VirtualPathManySchema.safeParse(sourcePaths.map(sanitize)),
    destDirPath: VirtualPathOneSchema.safeParse(sanitize(destDirPath)),
  };
  if (!parsed.sourcePaths.success || !parsed.destDirPath.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [
        { prop: "sourcePaths", issues: parsed.sourcePaths.error?.issues },
        { prop: "destDirPath", issues: parsed.destDirPath.error?.issues },
      ],
    };
  }

  const normalizedSourcePaths = unique(parsed.sourcePaths.data);
  const normalizedDestDirPath = parsed.destDirPath.data;

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "認証されていません。",
    };
  }

  // 仮想パス→物理パス
  const realDestDirPath = getServerMediaPath(normalizedDestDirPath);

  // ディレクトリ内のエントリ名一覧を取得（後続の自動連番で使う）
  const existingNames = new Set<string>();
  try {
    const entries = await readdir(realDestDirPath);
    entries.forEach((name) => existingNames.add(name));
  } catch (e) {
    logger.error("action:copy:read-directory", e);
    return {
      success: false,
      message: "ファイルまたはフォルダのコピーに失敗しました。",
    };
  }

  const completed: CopyNodesSuccess["completed"] = [];
  const failed: CopyNodesSuccess["failed"] = [];
  const skipped: CopyNodesSuccess["skipped"] = [];

  for (const srcVirtualPath of normalizedSourcePaths) {
    // 子孫チェック
    if (
      normalizedDestDirPath === srcVirtualPath ||
      normalizedDestDirPath.startsWith(srcVirtualPath + "/")
    ) {
      skipped.push({
        path: srcVirtualPath,
        message: "自分自身またはサブフォルダへの操作はできません。",
      });
      continue;
    }

    // ルートフォルダ保護
    if (isRootPath(srcVirtualPath)) {
      skipped.push({
        path: srcVirtualPath,
        message: "ルートフォルダは操作できません。",
      });
      continue;
    }

    // システムフォルダ保護
    if (isSystemHiddenVirtualPath(srcVirtualPath)) {
      skipped.push({
        path: srcVirtualPath,
        message: "システムフォルダは操作できません。",
      });
      continue;
    }

    // 仮想パス→物理パス
    const srcRealPath = getServerMediaPath(srcVirtualPath);

    // ディレクトリ判定
    const srcPathInfo = await getPathInfo(srcRealPath);
    if (!srcPathInfo.exists) {
      if (srcPathInfo.error === "not-found") {
        failed.push({
          path: srcVirtualPath,
          message: "ファイルまたはフォルダが存在しません。",
        });
        continue;
      } else {
        failed.push({
          path: srcVirtualPath,
          message: "ファイルまたはフォルダへのアクセスが拒否されました。",
        });
        continue;
      }
    }
    const isDirectory = srcPathInfo.isDirectory;

    // 認可
    if (
      (!isDirectory && !hasPermission(user, "file:copy")) ||
      (isDirectory && !hasPermission(user, "folder:copy"))
    ) {
      skipped.push({
        path: srcVirtualPath,
        message: "権限がありません。",
      });
      continue;
    }

    const srcName = basename(srcVirtualPath);

    // 新しい名前を確定（名前衝突があれば (2), (3), ... などの連番を付与）
    let currentSrcName = srcName;
    let counter = 2;
    while (existingNames.has(currentSrcName)) {
      if (isDirectory) {
        // フォルダの場合: 「フォルダ名 (2)」
        currentSrcName = `${srcName} (${counter})`;
      } else {
        // ファイルの場合: 「ファイル名 (2).ext」
        const ext = extname(srcName);
        const base = basename(srcName, ext);
        currentSrcName = `${base} (${counter})${ext}`;
      }
      counter++;
    }

    // 最終的なパスを決定
    const destVirtualPath = `${normalizedDestDirPath}/${currentSrcName}`;
    const destRealPath = getServerMediaPath(destVirtualPath);

    const srcThumbPath = getServerMediaThumbPath(srcVirtualPath, isDirectory);
    const destThumbPath = getServerMediaThumbPath(destVirtualPath, isDirectory);

    // サムネイルコピー（失敗しても本体コピーは続行）
    let thumbCopied = false;
    try {
      await cp(srcThumbPath, destThumbPath, { recursive: true });
      thumbCopied = true;
    } catch (e) {
      if (!isFsNotFoundError(e)) {
        logger.error("action:copy:thumb", e);
      }
    }

    // FSコピー
    try {
      await cp(srcRealPath, destRealPath, { recursive: true });
    } catch (e) {
      logger.error("action:copy:fs", e);

      // FSロールバック（中途半端なコピー結果を削除）
      try {
        await rm(destRealPath, { recursive: true, force: true });
      } catch (e) {
        logger.error("action:copy:fs:fs-rollback", e);
      }

      // サムネイルロールバック
      if (thumbCopied) {
        try {
          await rm(destThumbPath, { recursive: true, force: true });
        } catch (e) {
          logger.error("action:copy:fs:thumb-rollback", e);
        }
      }

      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダのコピーに失敗しました。",
      });
      continue;
    }

    // DB更新
    try {
      await copyNodeInDb({
        srcVirtualPath,
        destVirtualPath,
        isDirectory,
        userId: user.id,
      });
    } catch (e) {
      logger.error("action:copy:db", e);

      // FSロールバック（中途半端なコピー結果を削除）
      try {
        await rm(destRealPath, { recursive: true, force: true });
      } catch (e) {
        logger.error("action:copy:db:fs-rollback", e);
      }

      // サムネイルロールバック
      if (thumbCopied) {
        try {
          await rm(destThumbPath, { recursive: true, force: true });
        } catch (e) {
          logger.error("action:copy:db:thumb-rollback", e);
        }
      }

      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダのコピーに失敗しました。",
      });
      continue;
    }

    completed.push({ path: srcVirtualPath });

    // 次のループのファイルがこれと衝突するのを防ぐため、確定した名前を Set に予約登録
    existingNames.add(currentSrcName);
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

type DeleteNodesResult =
  | {
      success: true;
      completed: { path: string }[];
      failed: { path: string; message: string }[];
      skipped: { path: string; message: string }[];
    }
  | {
      success: false;
      message: string;
      errors?: { prop: string; issues?: unknown[] }[];
    };

type DeleteNodesSuccess = Extract<DeleteNodesResult, { success: true }>;

// 削除（ゴミ箱フォルダへの移動）
export async function deleteNodesAction(
  sourcePaths: string[]
): Promise<DeleteNodesResult> {
  // 入力バリデーション＋正規化
  if (!sourcePaths || sourcePaths.length === 0) {
    return {
      success: false,
      message: "処理対象のパスが指定されていません。",
    };
  }

  const parsed = {
    sourcePaths: VirtualPathManySchema.safeParse(sourcePaths.map(sanitize)),
  };
  if (!parsed.sourcePaths.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [
        { prop: "sourcePaths", issues: parsed.sourcePaths.error?.issues },
      ],
    };
  }

  const normalizedSourcePaths = unique(parsed.sourcePaths.data);

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "認証されていません。",
    };
  }

  const completed: DeleteNodesSuccess["completed"] = [];
  const failed: DeleteNodesSuccess["failed"] = [];
  const skipped: DeleteNodesSuccess["skipped"] = [];

  for (const srcVirtualPath of normalizedSourcePaths) {
    // ルートフォルダ保護
    if (isRootPath(srcVirtualPath)) {
      skipped.push({
        path: srcVirtualPath,
        message: "ルートフォルダは操作できません。",
      });
      continue;
    }

    // システムフォルダ保護
    if (isSystemHiddenVirtualPath(srcVirtualPath)) {
      skipped.push({
        path: srcVirtualPath,
        message: "システムフォルダは操作できません。",
      });
      continue;
    }

    // ゴミ箱に移動しても仮想パスは変わらない（物理パスのみ変更）
    const destVirtualPath = srcVirtualPath;

    // 仮想パス→物理パス
    const srcRealPath = getServerMediaPath(srcVirtualPath);
    const destRealPath = getServerMediaTrashPath(destVirtualPath);

    // ディレクトリ判定
    const srcPathInfo = await getPathInfo(srcRealPath);
    if (!srcPathInfo.exists) {
      if (srcPathInfo.error === "not-found") {
        failed.push({
          path: srcVirtualPath,
          message: "ファイルまたはフォルダが存在しません。",
        });
        continue;
      } else {
        failed.push({
          path: srcVirtualPath,
          message: "ファイルまたはフォルダへのアクセスが拒否されました。",
        });
        continue;
      }
    }
    const isDirectory = srcPathInfo.isDirectory;

    // 認可
    if (
      (!isDirectory && !hasPermission(user, "file:delete")) ||
      (isDirectory && !hasPermission(user, "folder:delete"))
    ) {
      skipped.push({
        path: srcVirtualPath,
        message: "権限がありません。",
      });
      continue;
    }

    // 移動先フォルダ作成
    try {
      await mkdir(dirname(destRealPath), { recursive: true });
    } catch (e) {
      logger.error("action:delete:create-direcory", e);
      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダの削除に失敗しました。",
      });
      continue;
    }

    // FS移動
    try {
      await recursiveMergeMove(srcRealPath, destRealPath);
    } catch (e) {
      logger.error("action:delete:move", e);
      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダの削除に失敗しました。",
      });
      continue;
    }

    // DB更新不要：.trash フォルダへの移動のみ

    completed.push({ path: srcVirtualPath });
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

type RestoreNodesResult =
  | {
      success: true;
      completed: { path: string }[];
      failed: { path: string; message: string }[];
      skipped: { path: string; message: string }[];
    }
  | {
      success: false;
      message: string;
      errors?: { prop: string; issues?: unknown[] }[];
    };

type RestoreNodesSuccess = Extract<RestoreNodesResult, { success: true }>;

// 復元（ゴミ箱フォルダから元のフォルダへの移動）
export async function restoreNodesAction(
  sourcePaths: string[]
): Promise<RestoreNodesResult> {
  // 入力バリデーション＋正規化
  if (!sourcePaths || sourcePaths.length === 0) {
    return {
      success: false,
      message: "処理対象のパスが指定されていません。",
    };
  }

  const parsed = {
    sourcePaths: VirtualPathManySchema.safeParse(sourcePaths.map(sanitize)),
  };
  if (!parsed.sourcePaths.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [
        { prop: "sourcePaths", issues: parsed.sourcePaths.error?.issues },
      ],
    };
  }

  const normalizedSourcePaths = unique(parsed.sourcePaths.data);

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "認証されていません。",
    };
  }

  const completed: RestoreNodesSuccess["completed"] = [];
  const failed: RestoreNodesSuccess["failed"] = [];
  const skipped: RestoreNodesSuccess["skipped"] = [];

  for (const srcVirtualPath of normalizedSourcePaths) {
    // ルートフォルダ保護
    if (isRootPath(srcVirtualPath)) {
      skipped.push({
        path: srcVirtualPath,
        message: "ルートフォルダは操作できません。",
      });
      continue;
    }

    // システムフォルダ保護
    if (isSystemHiddenVirtualPath(srcVirtualPath)) {
      skipped.push({
        path: srcVirtualPath,
        message: "システムフォルダは操作できません。",
      });
      continue;
    }

    // ゴミ箱から元のフォルダに移動しても仮想パスは変わらない（物理パスのみ変更）
    const destVirtualPath = srcVirtualPath;

    // 仮想パス→物理パス
    const srcRealPath = getServerMediaTrashPath(srcVirtualPath);
    const destRealPath = getServerMediaPath(destVirtualPath);
    const destRealParentPath = dirname(destRealPath);

    // ディレクトリ判定
    const srcPathInfo = await getPathInfo(srcRealPath);
    if (!srcPathInfo.exists) {
      if (srcPathInfo.error === "not-found") {
        failed.push({
          path: srcVirtualPath,
          message: "ファイルまたはフォルダが存在しません。",
        });
        continue;
      } else {
        failed.push({
          path: srcVirtualPath,
          message: "ファイルまたはフォルダへのアクセスが拒否されました。",
        });
        continue;
      }
    }
    const isDirectory = srcPathInfo.isDirectory;

    // 認可
    if (
      (!isDirectory && !hasPermission(user, "file:restore")) ||
      (isDirectory && !hasPermission(user, "folder:restore"))
    ) {
      skipped.push({
        path: srcVirtualPath,
        message: "権限がありません。",
      });
      continue;
    }

    // 移動先フォルダ作成
    try {
      await mkdir(destRealParentPath, { recursive: true });
    } catch (e) {
      logger.error("action:restore:create-direcory", e);
      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダの復元に失敗しました。",
      });
      continue;
    }

    // FS移動
    try {
      await recursiveMergeMove(srcRealPath, destRealPath);
    } catch (e) {
      logger.error("action:restore:move", e);
      failed.push({
        path: srcVirtualPath,
        message: "ファイルまたはフォルダの復元に失敗しました。",
      });
      continue;
    }

    // DB更新不要：元のフォルダへの移動のみ

    completed.push({ path: srcVirtualPath });
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

// 完全に削除
export async function deleteNodesPermanentlyAction(
  sourcePaths: string[]
): Promise<DeleteNodesResult> {
  // 入力バリデーション＋正規化
  if (!sourcePaths || sourcePaths.length === 0) {
    return {
      success: false,
      message: "処理対象のパスが指定されていません。",
    };
  }

  const parsed = {
    sourcePaths: VirtualPathManySchema.safeParse(sourcePaths.map(sanitize)),
  };
  if (!parsed.sourcePaths.success) {
    return {
      success: false,
      message: "入力エラーがあります。",
      errors: [
        { prop: "sourcePaths", issues: parsed.sourcePaths.error?.issues },
      ],
    };
  }

  const normalizedSourcePaths = unique(parsed.sourcePaths.data);

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "認証されていません。",
    };
  }

  const completed: DeleteNodesSuccess["completed"] = [];
  const failed: DeleteNodesSuccess["failed"] = [];
  const skipped: DeleteNodesSuccess["skipped"] = [];

  for (const srcVirtualPath of normalizedSourcePaths) {
    // ルートフォルダ保護
    if (isRootPath(srcVirtualPath)) {
      skipped.push({
        path: srcVirtualPath,
        message: "ルートフォルダは操作できません。",
      });
      continue;
    }

    // システムフォルダ保護
    if (isSystemHiddenVirtualPath(srcVirtualPath)) {
      skipped.push({
        path: srcVirtualPath,
        message: "システムフォルダは操作できません。",
      });
      continue;
    }

    // 仮想パス→物理パス
    const srcRealPath = getServerMediaTrashPath(srcVirtualPath);

    // ディレクトリ判定
    const srcPathInfo = await getPathInfo(srcRealPath);
    if (!srcPathInfo.exists) {
      if (srcPathInfo.error === "not-found") {
        failed.push({
          path: srcVirtualPath,
          message: "ファイルまたはフォルダが存在しません。",
        });
        continue;
      } else {
        failed.push({
          path: srcVirtualPath,
          message: "ファイルまたはフォルダへのアクセスが拒否されました。",
        });
        continue;
      }
    }
    const isDirectory = srcPathInfo.isDirectory;

    // 認可
    if (
      (!isDirectory && !hasPermission(user, "file:delete")) ||
      (isDirectory && !hasPermission(user, "folder:delete"))
    ) {
      skipped.push({
        path: srcVirtualPath,
        message: "権限がありません。",
      });
      continue;
    }

    // FS削除
    try {
      await rm(srcRealPath, { recursive: true, force: true });
    } catch (e) {
      logger.error("action:delete:permament", e);
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

// タイムスタンプ更新
export async function touchMediaTimestampAction(sourcePath: string) {
  // 認証
  await resolveCurrentUserOrThrow();

  // 入力バリデーション+正規化
  const normalizedSourcePath = normalizeVirtualPath(sourcePath);

  // ルートフォルダ保護
  if (normalizedSourcePath === "") {
    return { success: false, error: "ルートフォルダは操作できません。" };
  }

  // システムフォルダ保護
  if (isSystemHiddenVirtualPath(normalizedSourcePath)) {
    return { success: false, error: "システムフォルダは操作できません。" };
  }

  // FS 更新不要：タイムスタンプは utime や open->close では更新されないため

  // DB 更新
  try {
    await updateMediaFileMtime({ path: normalizedSourcePath });
  } catch (e) {
    console.error("failed to update database:", e);
    return {
      success: false,
      error: "タイムスタンプの更新に失敗しました。",
    };
  }

  return { success: true };
}

// メディアファイル一覧
export async function listMediaAction(dirPath: string) {
  // 認証
  await resolveCurrentUserOrThrow();

  // 入力バリデーション+正規化
  const normalizedDirPath = normalizeVirtualPath(dirPath);

  // システムフォルダ保護
  if (isSystemHiddenVirtualPath(normalizedDirPath)) {
    return { success: false, error: "システムフォルダは操作できません。" };
  }

  // 仮想パス→物理パス
  const virtualDirPath = normalizedDirPath;
  const realDirPath = getServerMediaPath(virtualDirPath);

  let entries: Dirent[];
  try {
    entries = await readdir(realDirPath, { withFileTypes: true });
  } catch (e) {
    if (isFsNotFoundError(e)) {
      return { success: false, error: "フォルダが見つかりません。" };
    }
    if (isFsPermissionError(e)) {
      return { success: false, error: "フォルダへのアクセス権がありません。" };
    }
    console.error("failed to read directory", e);
    return { success: false, error: "ファイル一覧の取得に失敗しました。" };
  }

  const mediaFiles = entries
    .filter((e) => e.isFile()) // ファイルのみ対象
    .map((e) => {
      const type = detectMediaType(e.name);
      if (type === null) return null; // メディア以外を除く
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
