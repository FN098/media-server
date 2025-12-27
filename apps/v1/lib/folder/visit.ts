import { prisma } from "@/lib/prisma";

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
  });
}
