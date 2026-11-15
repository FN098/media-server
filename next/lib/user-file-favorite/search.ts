import { Prisma } from "@/generated/prisma/client";
import { MediaType } from "@/lib/file/media-types";
import { TagFilterMode } from "@/lib/filter/types";
import { FileNode } from "@/lib/node/types";
import { prisma } from "@/lib/prisma";
import { SortDirection, SortKey } from "@/lib/sort/sort-nodes";
import { normalizeForLike } from "@/lib/utils/japanese";
import { shuffleArray, shuffleArrayWithSeed } from "@/lib/utils/shuffle";

type FavoriteFileNode = Omit<FileNode, "type"> & {
  type: "image" | "video" | "audio";
  tags: {
    id: string;
    name: string;
  }[];
};

type SearchFavoriteParams = {
  userId: string;
  limit?: number;
  sortKey?: SortKey<FavoriteFileNode>;
  sortDirection?: SortDirection;
  shuffle?: boolean;
  seed?: string;
  mediaType?: string; // カンマ区切り
  query?: string;
  tagIds?: string; // カンマ区切り
  tagFilterMode?: TagFilterMode;
};

type SearchFavoriteResult = {
  files: FavoriteFileNode[];
  total: number; // limit を考慮しない全件数
};

const favoriteFileSelect = {
  file: {
    select: {
      id: true,
      parentFolderId: true,
      name: true,
      mtime: true,
      size: true,
      previewFileId: true,
      type: true,
      isLocked: true,
      deletedAt: true,
      fileTags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },
  updatedAt: true,
} as const satisfies Prisma.UserFileFavoriteSelect;

type FavoriteFile = Prisma.UserFileFavoriteGetPayload<{
  select: typeof favoriteFileSelect;
}>;

function buildWhere({
  userId,
  mediaType,
  query,
  tagIds,
  tagFilterMode,
}: SearchFavoriteParams): Prisma.UserFileFavoriteWhereInput {
  const normalizedQuery = query ? normalizeForLike(query.trim()) : undefined;

  const where: Prisma.UserFileFavoriteWhereInput = { userId };

  const fileConditions: Prisma.FileWhereInput[] = [];

  if (mediaType) {
    const types = mediaType.split(",") as MediaType[];
    fileConditions.push({
      type: {
        in: types,
      },
    });
  }

  if (normalizedQuery) {
    fileConditions.push({
      name: { contains: normalizedQuery },
    });
  }

  if (tagFilterMode) {
    if (tagFilterMode === "EMPTY") {
      // タグが一つも設定されていない
      fileConditions.push({
        fileTags: { none: {} },
      });
    } else {
      const ids = tagIds ? tagIds.split(",").filter(Boolean) : [];
      if (ids.length > 0) {
        switch (tagFilterMode) {
          case "OR":
            // 指定したタグのうち、いずれか1つでも含まれている
            fileConditions.push({
              fileTags: {
                some: { tagId: { in: ids } },
              },
            });
            break;

          case "NOT":
            // 指定したタグが1つも含まれていない
            fileConditions.push({
              fileTags: {
                none: { tagId: { in: ids } },
              },
            });
            break;

          case "AND":
          default:
            // 指定したタグがすべて含まれている
            ids.forEach((id) => {
              fileConditions.push({
                fileTags: {
                  some: { tagId: id },
                },
              });
            });
            break;
        }
      }
    }
  }

  if (fileConditions.length > 0) {
    where.file = { AND: fileConditions };
  }

  return where;
}

function buildOrderBy({
  sortKey: key,
  sortDirection: dir,
}: SearchFavoriteParams): Prisma.UserFileFavoriteOrderByWithRelationInput {
  switch (key) {
    case "name":
      return { file: { name: dir } };
    case "mtime":
      return { file: { mtime: dir } };
    case "size":
      return { file: { size: dir } };
    case "favoritedAt":
      return { updatedAt: "desc" };
    default:
      return { updatedAt: "desc" };
  }
}

function toMediaFileNode(f: FavoriteFile): FavoriteFileNode {
  return {
    id: f.file.id,
    parentFolderId: f.file.parentFolderId,
    name: f.file.name,
    type: f.file.type as MediaType,
    isDirectory: false,
    size: Number(f.file.size),
    mtime: f.file.mtime,
    tags: f.file.fileTags.map((t) => ({
      id: t.tag.id,
      name: t.tag.name,
    })),
    favoritedAt: f.updatedAt,
    previewFileId: f.file.previewFileId,
    isLocked: f.file.isLocked,
    deletedAt: f.file.deletedAt,
  };
}

async function findSortedFavorites(
  params: SearchFavoriteParams,
  where: Prisma.UserFileFavoriteWhereInput
): Promise<FavoriteFile[]> {
  const orderBy = buildOrderBy(params);

  return prisma.userFileFavorite.findMany({
    where,
    select: favoriteFileSelect,
    orderBy,
    take: params.limit,
  });
}

async function findShuffledFavorites(
  params: SearchFavoriteParams,
  where: Prisma.UserFileFavoriteWhereInput
): Promise<FavoriteFile[]> {
  const allRecords = await prisma.userFileFavorite.findMany({
    where,
    select: { fileId: true },
  });

  let fileIds = allRecords.map((r) => r.fileId);

  fileIds = params.seed
    ? shuffleArrayWithSeed(fileIds, params.seed)
    : shuffleArray(fileIds);

  const slicedFileIds = params.limit ? fileIds.slice(0, params.limit) : fileIds;

  const favorites = await prisma.userFileFavorite.findMany({
    where: {
      userId: params.userId,
      fileId: { in: slicedFileIds },
    },
    select: favoriteFileSelect,
  });

  const map = new Map(favorites.map((f) => [f.file.id, f]));

  return slicedFileIds
    .map((id) => map.get(id))
    .filter((f): f is FavoriteFile => !!f);
}

export async function searchFavoriteFileNodes(
  params: SearchFavoriteParams
): Promise<FavoriteFileNode[]> {
  const where = buildWhere(params);

  const favorites = params.shuffle
    ? await findShuffledFavorites(params, where)
    : await findSortedFavorites(params, where);

  const files = favorites.map(toMediaFileNode);
  return files;
}

export async function searchFavoriteFileCount(
  params: SearchFavoriteParams
): Promise<number> {
  const where = buildWhere(params);
  const total = await prisma.userFileFavorite.count({ where });

  return total;
}
