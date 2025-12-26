import { prisma } from "@/lib/prisma";

const MAX_RECENTS = 20;

export async function visitFolder(
  dirPath: string,
  userId: string
): Promise<void> {
  const normalizedDirPath = dirPath.replace(/\/+$/, "");

  // 最近訪れたフォルダを更新
  await prisma.$transaction(async (tx) => {
    await tx.recentFolder.upsert({
      where: {
        userId_dirPath: {
          userId,
          dirPath: normalizedDirPath,
        },
      },
      update: {
        lastViewedAt: new Date(),
      },
      create: {
        userId,
        dirPath: normalizedDirPath,
      },
    });

    const recents = await tx.recentFolder.findMany({
      where: { userId },
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
}
