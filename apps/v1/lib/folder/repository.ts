import type { VisitedFolder } from "@/generated/prisma/client";
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
