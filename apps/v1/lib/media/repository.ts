import type { Media } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function findMediaByPath(path: string): Promise<Media | null> {
  return prisma.media.findUnique({
    where: {
      path,
    },
  });
}

export async function findMediaByPathOrThrow(
  path: string
): Promise<Media | null> {
  return prisma.media.findUniqueOrThrow({
    where: {
      path,
    },
  });
}
