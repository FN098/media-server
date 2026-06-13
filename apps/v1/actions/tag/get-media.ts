"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { getClientExplorerPath } from "@/lib/path/helpers";
import { prisma } from "@/lib/prisma";
import { basename } from "path";
import z from "zod";

const InputSchema = z.object({
  tagId: z.uuid(),
  limit: z.number().min(1).max(100).optional().default(20),
});

export type MediaInfo = {
  id: string;
  title: string;
  path: string;
  url: string;
};

type ActionResult =
  | { success: true; media: MediaInfo[] }
  | { success: false; message: string };

// タグに紐づくメディア情報を一覧取得
export async function getMediaInfoByTagIdAction(
  input: z.input<typeof InputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  const { tagId, limit } = parsed.data;

  // 認証＋認可
  const auth = await authorize("file:describe", "file:list");
  if (!auth.success) {
    return auth;
  }

  try {
    const media = await prisma.media.findMany({
      where: {
        mediaTags: {
          some: {
            tagId: tagId,
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
      take: limit,
    });

    const result = media.map((m) => {
      return {
        id: m.id,
        title: basename(m.dirPath),
        path: m.path,
        url: `${getClientExplorerPath(m.dirPath)}?tagIds=${tagId}`,
      };
    });

    return { success: true, media: result };
  } catch (error) {
    logger.error("action:get-tag-media", error);
    return { success: false, message: "メディア情報の取得に失敗しました。" };
  }
}
