"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { PATHS } from "@/lib/path/paths";
import { chunk, unique } from "@/lib/utils/array";
import { rm } from "fs/promises";
import path from "path";
import z from "zod";

const InputSchema = z.object({
  sourcePaths: z
    .array(z.string())
    .min(1, "ファイルまたはフォルダを1件以上指定してください。")
    .transform((paths) => unique(paths)),
});

type ActionResult =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      deletedCount: number;
    };

// サムネイル一括削除
export async function deleteManyThumbnailsAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { sourcePaths } = parsed.data;

  // 認証＋認可
  const auth = await authorize("thumbnail:delete-many");
  if (!auth.success) {
    return auth;
  }

  const thumbRoot = path.resolve(PATHS.server.media.thumb.root);

  const chunks = chunk(
    sourcePaths,
    50 // 並列処理数
  );

  let deletedCount = 0;

  try {
    for (const paths of chunks) {
      await Promise.all(
        paths.map(async (path) => {
          // 安全確認: thumbRoot配下であること
          if (!path.startsWith(thumbRoot)) return;
          await rm(path, { recursive: true, force: true });
          deletedCount++;
        })
      );
    }
  } catch (error) {
    logger.error("action:delete-many-thumbs", error);
    return {
      success: false,
      message: "サムネイルの一括削除に失敗しました。",
    };
  }

  return { success: true, deletedCount };
}
