"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

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
  // 認証＋認可
  const auth = await authorize("tag:scan-unused");
  if (!auth.success) {
    return auth;
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
