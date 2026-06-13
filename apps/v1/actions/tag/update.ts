"use server";

import { authorize } from "@/lib/authorization/authorize";
import { AbortError } from "@/lib/errors/abort-error";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { EditableVirtualPathManySchema } from "@/lib/virtual-path/schemas";
import z from "zod";

const MediaTagOperationSchema = z.object({
  tagId: z.uuid(),
  operator: z.enum(["add", "remove"]),
});

const UniqueMediaTagOperationsSchema = z
  .array(MediaTagOperationSchema)
  .superRefine((ops, ctx) => {
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
  });

const InputSchema = z.object({
  mediaPaths: EditableVirtualPathManySchema,
  operations: UniqueMediaTagOperationsSchema,
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

  // NOTE: 将来的に「追加だけ」「削除だけ」の権限を持つユーザーが出てきた場合は修正予定
  // 認証＋認可
  const auth = await authorize("tag:link-media", "tag:create", "tag:delete");
  if (!auth.success) {
    return auth;
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
