import { resolveCurrentUserOrThrow } from "@/lib/auth/resolver";
import { prisma } from "@/lib/prisma";

export async function getRelatedTags(
  paths: string[],
  options?: { limit?: number }
) {
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

export async function getFavoriteTags(options?: { limit?: number }) {
  const { id: userId } = await resolveCurrentUserOrThrow();

  const tags = await prisma.tag.findMany({
    where: {
      userFavorites: {
        some: {
          userId: userId,
        },
      },
      isActive: true,
    },
    orderBy: [{ kana: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
    },
    take: options?.limit,
  });

  return tags;
}
