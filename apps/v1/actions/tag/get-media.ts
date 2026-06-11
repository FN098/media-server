"use server";

import { getClientExplorerPath } from "@/lib/path/helpers";
import { prisma } from "@/lib/prisma";
import { basename } from "path";

export async function getMediaByTagId(tagId: string, limit = 20) {
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
      const displayTitle = basename(m.dirPath);

      return {
        id: m.id,
        title: displayTitle,
        path: m.path,
        url: `${getClientExplorerPath(m.dirPath)}?tagIds=${tagId}`,
      };
    });

    return {
      success: true,
      media: result,
    };
  } catch (error) {
    console.error("Failed to fetch media by tag:", error);
    return {
      success: false,
      error: "メディア情報の取得に失敗しました。",
    };
  }
}
