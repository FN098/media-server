"use server";

import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import z from "zod";

const inputSchema = z.object({
  tagId: z.uuid(),
  limit: z.number().min(1).max(100).optional().default(20),
});

export type FileInfo = {
  id: string;
  name: string;
};

type ActionResult =
  { success: true; files: FileInfo[] } | { success: false; message: string };

export async function findManyFilesAction(
  input: z.input<typeof inputSchema>
): Promise<ActionResult> {
  // 入力バリデーション＋正規化
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { tagId, limit } = parsed.data;

  // 認証＋認可
  const auth = await authorize("find-many-files");
  if (!auth.success) {
    return auth;
  }

  try {
    const files = await prisma.file.findMany({
      where: {
        fileTags: {
          some: {
            tagId: tagId,
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
      take: limit,
    });

    const result = files.map((f) => {
      return {
        id: f.id,
        name: f.id,
      };
    });

    return { success: true, files: result };
  } catch (error) {
    logger.error("find-many-files-action", error);
    return { success: false, message: "メディア情報の取得に失敗しました。" };
  }
}
