"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermissions } from "@/lib/authorization/permission";
import { AbortError } from "@/lib/errors/abort-error";
import { logger } from "@/lib/logger";
import { isSystemHiddenVirtualPath } from "@/lib/path/protections";
import { prisma } from "@/lib/prisma";
import { isRootPath } from "@/lib/virtual-path/guard";
import { VirtualPathManySchema } from "@/lib/virtual-path/schemas";
import z from "zod";

const MediaTagOperationSchema = z.object({
  tagId: z.uuid(),
  operator: z.enum(["add", "remove"]),
});

const InputSchema = z.object({
  mediaPaths: VirtualPathManySchema.superRefine((paths, ctx) => {
    for (const [index, path] of paths.entries()) {
      if (isRootPath(path)) {
        ctx.addIssue({
          code: "custom",
          path: [index],
          message: "ルートフォルダは操作できません。",
        });
      }

      if (isSystemHiddenVirtualPath(path)) {
        ctx.addIssue({
          code: "custom",
          path: [index],
          message: "システムフォルダは操作できません。",
        });
      }
    }
  }),

  operations: z.array(MediaTagOperationSchema).superRefine((ops, ctx) => {
    const seen = new Set<string>();

    for (const [index, op] of ops.entries()) {
      if (seen.has(op.tagId)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "tagId"],
          message: "タグが重複しています。",
        });
      }

      seen.add(op.tagId);
    }
  }),

  strict: z.boolean().optional().default(false),
});

type ActionResult = { success: true } | { success: false; message: string };

// タグ紐づけ・クリーンアップ
export async function updateMediaTagsAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { mediaPaths, operations, strict } = parsed.data;

  if (mediaPaths.length === 0 || operations.length === 0) {
    return { success: true };
  }

  const tagIdsToAdd = operations
    .filter((op) => op.operator === "add")
    .map((op) => op.tagId);

  const tagIdsToRemove = operations
    .filter((op) => op.operator === "remove")
    .map((op) => op.tagId);

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return { success: false, message: "認証されていません。" };
  }

  // 認可
  if (
    (tagIdsToAdd.length > 0 &&
      !hasPermissions(user, ["tag:link-media", "tag:create"])) ||
    (tagIdsToRemove.length > 0 &&
      !hasPermissions(user, ["tag:link-media", "tag:delete"]))
  ) {
    return { success: false, message: "権限がありません。" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // mediaPaths から mediaId のリストを取得
      const mediaList = await tx.media.findMany({
        where: { path: { in: mediaPaths } },
        select: { id: true },
      });

      const mediaIds = mediaList.map((m) => m.id);
      if (mediaIds.length === 0) return;

      // 厳密にやるなら存在しないメディアがあればエラーにする
      if (strict && mediaList.length !== mediaPaths.length) {
        throw new AbortError("存在しないメディアがあります");
      }

      // 紐付けの解除
      if (tagIdsToRemove.length > 0) {
        await tx.mediaTag.deleteMany({
          where: {
            mediaId: { in: mediaIds },
            tagId: { in: tagIdsToRemove },
          },
        });
      }

      // 紐付けの追加
      if (tagIdsToAdd.length > 0) {
        // 全組み合わせを作成
        const data = mediaIds.flatMap((mediaId) =>
          tagIdsToAdd.map((tagId) => ({
            mediaId,
            tagId,
          }))
        );

        await tx.mediaTag.createMany({
          data,
          skipDuplicates: true, // 既に存在するペアは無視
        });
      }

      // 孤立したタグの削除 (クリーンアップ)
      if (tagIdsToRemove.length > 0) {
        await tx.tag.deleteMany({
          where: {
            id: { in: tagIdsToRemove },
            mediaTags: {
              none: {}, // どの MediaTag からも参照されていない
            },
          },
        });
      }
    });

    return { success: true };
  } catch (error) {
    logger.error("action:update-media-tags", error);
    return { success: false, message: "タグの更新に失敗しました" };
  }
}
