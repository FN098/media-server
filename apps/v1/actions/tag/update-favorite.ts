"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import z from "zod";

const InputSchema = z.object({
  id: z.uuid(),
  isFavorite: z.boolean(),
});

type ActionResult =
  | { success: true; isFavorite: boolean }
  | { success: false; message: string };

// タグお気に入り更新
export async function updateTagFavoriteAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { id, isFavorite } = parsed.data;

  // 認証＋認可
  const auth = await authorize("tag:update-favorite");
  if (!auth.success) {
    return auth;
  }

  const { user } = auth;

  try {
    if (isFavorite) {
      // お気に入り登録：UserTagFavorite レコードを作成
      // すでに存在する場合にエラーにならないよう upsert か create (ignore) 的な処理にする
      await prisma.userTagFavorite.upsert({
        where: {
          userId_tagId: {
            userId: user.id,
            tagId: id,
          },
        },
        update: {}, // すでに存在する場合は何もしない
        create: {
          userId: user.id,
          tagId: id,
        },
      });
    } else {
      // お気に入り解除：UserTagFavorite レコードを削除
      // 存在しないレコードを delete するとエラーになるため deleteMany を使用
      await prisma.userTagFavorite.deleteMany({
        where: {
          userId: user.id,
          tagId: id,
        },
      });
    }

    // フロントエンドとの互換性のために、現在の状態を返す
    return { success: true, isFavorite };
  } catch (error) {
    logger.error("action:update-tag-favorite", error);
    return { success: false, message: "タグのお気に入り更新に失敗しました。" };
  }
}
