"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/authorization/permission";
import { prisma } from "@/lib/prisma";
import { logger } from "better-auth";

type TagInfo = {
  id: string;
  name: string;
  usageCount: number;
};

type ActionResult =
  | { success: true; tags: TagInfo[] }
  | { success: false; message: string };

// 不要タグスキャン
export async function scanUnusedTagsAction(): Promise<ActionResult> {
  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return { success: false, message: "認証されていません。" };
  }

  // 認可
  if (!hasPermission(user, "tag:scan-unused")) {
    return { success: false, message: "権限がありません。" };
  }

  try {
    // どの MediaTag にも紐付いていないタグを取得
    const unusedTags = await prisma.tag.findMany({
      where: {
        mediaTags: {
          none: {}, // リレーションが空のもの
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: { mediaTags: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      tags: unusedTags.map((t) => ({
        id: t.id,
        name: t.name,
        usageCount: t._count.mediaTags,
      })),
    };
  } catch (error) {
    logger.error("action:scan-unused-tags", error);
    return { success: false, message: "タグのスキャンに失敗しました。" };
  }
}
