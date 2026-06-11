"use server";

import { resolveCurrentUserOrThrow } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

// タグお気に入り更新
export async function updateTagFavoriteAction(id: string, isFavorite: boolean) {
  try {
    const { id: userId } = await resolveCurrentUserOrThrow();

    if (isFavorite) {
      // お気に入り登録：UserTagFavorite レコードを作成
      // すでに存在する場合にエラーにならないよう upsert か create (ignore) 的な処理にする
      await prisma.userTagFavorite.upsert({
        where: {
          userId_tagId: {
            userId,
            tagId: id,
          },
        },
        update: {}, // すでに存在する場合は何もしない
        create: {
          userId,
          tagId: id,
        },
      });
    } else {
      // お気に入り解除：UserTagFavorite レコードを削除
      // 存在しないレコードを delete するとエラーになるため deleteMany を使用
      await prisma.userTagFavorite.deleteMany({
        where: {
          userId,
          tagId: id,
        },
      });
    }

    // フロントエンドとの互換性のために、現在の状態を返す
    return { success: true, isFavorite };
  } catch (error) {
    console.error("Update Tag Favorite Error:", error);
    return { success: false, error: "タグのお気に入り更新に失敗しました。" };
  }
}
