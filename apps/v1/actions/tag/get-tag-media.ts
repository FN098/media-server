"use server";

import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermissions } from "@/lib/authorization/permission";
import { logger } from "@/lib/logger";
import { getClientExplorerPath } from "@/lib/path/helpers";
import { prisma } from "@/lib/prisma";
import { basename } from "path";
import z from "zod";

const InputSchema = z.object({
  tagId: z.uuid(),
  limit: z.number().min(1).max(100).optional().default(20),
});

export type TagMedia = {
  id: string;
  title: string;
  path: string;
  url: string;
};

type ActionResult =
  | { success: true; media: TagMedia[] }
  | { success: false; message: string };

export async function getTagMediaAction(
  tagId: string,
  limit?: number
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse({ tagId, limit });
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const normalizedTagId = parsed.data.tagId;
  const normalizedLimit = parsed.data.limit;

  // 認証
  const user = await resolveCurrentUser();
  if (!user) {
    return { success: false, message: "認証されていません。" };
  }

  // 認可
  if (!hasPermissions(user, ["file:describe", "file:list"])) {
    return { success: false, message: "権限がありません。" };
  }

  try {
    const media = await prisma.media.findMany({
      where: {
        mediaTags: {
          some: {
            tagId: normalizedTagId,
          },
        },
      },
      // dirPath が同じものは 1 つのレコードのみを返す（DBレベルでのグループ化）
      distinct: ["dirPath"],
      select: {
        id: true,
        title: true,
        path: true,
        dirPath: true,
      },
      orderBy: {
        dirPath: "asc",
      },
      take: normalizedLimit,
    });

    const result = media.map((m) => {
      return {
        id: m.id,
        title: basename(m.dirPath),
        path: m.path,
        url: `${getClientExplorerPath(m.dirPath)}?tagIds=${normalizedTagId}`,
      };
    });

    return { success: true, media: result };
  } catch (error) {
    logger.error("action:get-tag-media", error);
    return { success: false, message: "メディア情報の取得に失敗しました。" };
  }
}
