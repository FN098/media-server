import { resolveCurrentUserOrThrow } from "@/lib/auth/resolvers";
import { prisma } from "@/lib/prisma";
import { Tag } from "@/lib/tag/types";

export async function getTagsByIds(
  ids: string[],
  options?: { limit?: number }
): Promise<Tag[]> {
  if (ids.length > 0) {
    return await prisma.tag.findMany({
      where: {
        id: { in: ids },
        isActive: true,
      },
      orderBy: [{ kana: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
      take: options?.limit,
    });
  }

  return [];
}

export async function getRelatedTags(
  paths: string[],
  options?: { limit?: number }
): Promise<Tag[]> {
  if (paths.length > 0) {
    return await prisma.tag.findMany({
      where: {
        mediaTags: {
          some: { media: { path: { in: paths } } },
        },
        isActive: true,
      },
      orderBy: [{ kana: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
      take: options?.limit,
    });
  }

  return [];
}

export async function getFavoriteTags(options?: {
  limit?: number;
}): Promise<Tag[]> {
  const { id: userId } = await resolveCurrentUserOrThrow();

  const favorites = await prisma.userTagFavorite.findMany({
    where: { userId },
    select: {
      tag: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ tag: { kana: "asc" } }, { tag: { name: "asc" } }],
    take: options?.limit,
  });

  return favorites.map((f) => f.tag);
}
