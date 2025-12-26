"use server";

import { USER } from "@/basic-auth";
import { prisma } from "@/lib/prisma";
import { findUserById } from "@/lib/user/repository";

const MAX_RECENTS = 20;

type VisitFolderResult = {
  message: string;
  ok: boolean;
};

export async function visitFolder(dirPath: string): Promise<VisitFolderResult> {
  // TODO: ユーザー認証機能実装後に差し替える
  const user = await findUserById(USER);
  if (!user) return { message: "unauthorized", ok: false };

  const normalizedDirPath = dirPath.replace(/\/+$/, "");

  // 最近訪れたフォルダを更新
  await prisma.$transaction(async (tx) => {
    await tx.recentFolder.upsert({
      where: {
        userId_dirPath: {
          userId: user.id,
          dirPath: normalizedDirPath,
        },
      },
      update: {},
      create: {
        userId: user.id,
        dirPath: normalizedDirPath,
      },
    });

    const recents = await tx.recentFolder.findMany({
      where: { userId: user.id },
      orderBy: { lastViewedAt: "desc" },
      skip: MAX_RECENTS,
      select: {
        userId: true,
        dirPath: true,
      },
    });

    if (recents.length > 0) {
      await tx.recentFolder.deleteMany({
        where: {
          OR: recents.map((r) => ({
            userId: r.userId,
            dirPath: r.dirPath,
          })),
        },
      });
    }
  });

  return {
    message: "success",
    ok: true,
  };
}
