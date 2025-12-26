import type { RecentFolder } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function getRecentFolders(
  userId: string
): Promise<RecentFolder[]> {
  return await prisma.recentFolder.findMany({
    where: { userId },
    orderBy: { lastViewedAt: "desc" },
  });
}
