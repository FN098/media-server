import type { VisitedFolder } from "@/generated/prisma/client";
import { DbFolder } from "@/lib/folder/types";
import { prisma } from "@/lib/prisma";

export async function getRecentFolders(
  userId: string,
  length: number
): Promise<VisitedFolder[]> {
  return await prisma.visitedFolder.findMany({
    where: { userId },
    take: length,
    orderBy: { lastViewedAt: "desc" },
  });
}

export async function getDbFolders(
  dirPaths: string[],
  userId: string
): Promise<DbFolder[]> {
  const folders = await prisma.visitedFolder.findMany({
    where: {
      userId,
      dirPath: { in: dirPaths },
    },
  });

  return folders.map((e) => ({
    path: e.dirPath,
    lastViewedAt: e.lastViewedAt,
  }));
}
