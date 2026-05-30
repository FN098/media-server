import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { FavoriteSortKey } from "@/lib/favorite/types";
import {
  RatingFilterMode,
  RatingOperator,
  TagFilterMode,
} from "@/lib/filter/types";
import { detectMediaType } from "@/lib/media/detectors";
import { SortDirection } from "@/lib/media/sort";
import { MediaNode, MediaType } from "@/lib/media/types";
import { normalizeForLike } from "@/lib/utils/japanese";
import { shuffleArray, shuffleArrayWithSeed } from "@/lib/utils/shuffle";
import path, { basename } from "path";

type SearchFavoriteParams = {
  userId: string;
  limit?: number;
  sortKey?: FavoriteSortKey;
  sortDirection?: SortDirection;
  shuffle?: boolean;
  seed?: string;
  mediaType?: string; // カンマ区切り
  query?: string;
  ratingMode?: RatingFilterMode;
  ratingOp?: RatingOperator;
  ratingVal?: string; // 1~5 の数値 or {min},{max}
  tagIds?: string; // カンマ区切り
  tagFilterMode?: TagFilterMode;
};

type SearchFavoriteResult = {
  nodes: MediaNode[];
  total: number; // limit を考慮しない全件数
};

type FavoriteWithMedia = Prisma.FavoriteGetPayload<{
  select: typeof favoriteSelect;
}>;

const favoriteSelect = {
  rating: true,
  createdAt: true,
  media: {
    select: {
      id: true,
      path: true,
      title: true,
      fileMtime: true,
      fileSize: true,
      previewPath: true,
      type: true,
      mediaTags: {
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
} as const satisfies Prisma.FavoriteSelect;

function buildWhere({
  userId,
  mediaType,
  query,
  ratingMode,
  ratingOp,
  ratingVal,
  tagIds,
  tagFilterMode,
}: SearchFavoriteParams): Prisma.FavoriteWhereInput {
  const normalizedQuery = query ? normalizeForLike(query.trim()) : undefined;

  const where: Prisma.FavoriteWhereInput = { userId };

  if (ratingMode === "rated") {
    // 具体的な星が付いているもの
    where.rating = { not: null };
  } else if (ratingMode === "unrated") {
    // お気に入り済みだが、星は付けていないもの
    where.rating = null;
  }

  if (ratingVal && ratingOp) {
    if (ratingOp === "between") {
      const [min, max] = ratingVal.split(",").map(Number);
      where.rating = { gte: min, lte: max };
    } else {
      const val = Number(ratingVal);
      where.rating = { [ratingOp]: val };
    }
  }

  const mediaConditions: Prisma.MediaWhereInput[] = [];

  if (mediaType) {
    const types = mediaType.split(",") as MediaType[];
    mediaConditions.push({
      type: {
        in: types,
      },
    });
  }

  if (normalizedQuery) {
    mediaConditions.push({
      OR: [
        { path: { contains: normalizedQuery } },
        { title: { contains: normalizedQuery } },
      ],
    });
  }

  if (tagFilterMode) {
    if (tagFilterMode === "EMPTY") {
      // タグが一つも設定されていない
      mediaConditions.push({
        mediaTags: { none: {} },
      });
    } else {
      const ids = tagIds ? tagIds.split(",").filter(Boolean) : [];
      if (ids.length > 0) {
        switch (tagFilterMode) {
          case "OR":
            // 指定したタグのうち、いずれか1つでも含まれている
            mediaConditions.push({
              mediaTags: {
                some: { tagId: { in: ids } },
              },
            });
            break;

          case "NOT":
            // 指定したタグが1つも含まれていない
            mediaConditions.push({
              mediaTags: {
                none: { tagId: { in: ids } },
              },
            });
            break;

          case "AND":
          default:
            // 指定したタグがすべて含まれている
            ids.forEach((id) => {
              mediaConditions.push({
                mediaTags: {
                  some: { tagId: id },
                },
              });
            });
            break;
        }
      }
    }
  }

  if (mediaConditions.length > 0) {
    where.media = { AND: mediaConditions };
  }

  return where;
}

function buildOrderBy({
  sortKey: key,
  sortDirection: dir,
}: SearchFavoriteParams): Prisma.FavoriteOrderByWithRelationInput {
  switch (key) {
    case "name":
    case "path":
      return { media: { path: dir } };
    case "mtime":
      return { media: { fileMtime: dir } };
    case "size":
      return { media: { fileSize: dir } };
    case "title":
      return { media: { title: dir } };
    case "rating":
      return { rating: dir };
    case "favoritedAt":
      return { createdAt: dir };
    default:
      return { createdAt: "desc" };
  }
}

function toMediaNode(f: FavoriteWithMedia): MediaNode {
  return {
    id: f.media.id,
    name: path.basename(f.media.path),
    path: f.media.path,
    type:
      (f.media.type as MediaType) ??
      detectMediaType(basename(f.media.path)) ??
      "file",
    isDirectory: false,
    size: Number(f.media.fileSize),
    mtime: f.media.fileMtime,
    title: f.media.title ?? null,
    tags: f.media.mediaTags.map((t) => ({
      id: t.tag.id,
      name: t.tag.name,
    })),
    rating: f.rating ?? null,
    favoritedAt: f.createdAt,
    previewPath: f.media.previewPath,
  };
}

async function findSortedFavorites(
  params: SearchFavoriteParams,
  where: Prisma.FavoriteWhereInput
): Promise<FavoriteWithMedia[]> {
  const orderBy = buildOrderBy(params);

  return prisma.favorite.findMany({
    where,
    select: favoriteSelect,
    orderBy,
    take: params.limit,
  });
}

async function findShuffledFavorites(
  params: SearchFavoriteParams,
  where: Prisma.FavoriteWhereInput
): Promise<FavoriteWithMedia[]> {
  const allRecords = await prisma.favorite.findMany({
    where,
    select: { mediaId: true },
  });

  let mediaIds = allRecords.map((r) => r.mediaId);

  mediaIds = params.seed
    ? shuffleArrayWithSeed(mediaIds, params.seed)
    : shuffleArray(mediaIds);

  const slicedMediaIds = params.limit
    ? mediaIds.slice(0, params.limit)
    : mediaIds;

  const favorites = await prisma.favorite.findMany({
    where: {
      userId: params.userId,
      mediaId: { in: slicedMediaIds },
    },
    select: favoriteSelect,
  });

  const map = new Map(favorites.map((f) => [f.media.id, f]));

  return slicedMediaIds
    .map((id) => map.get(id))
    .filter((f): f is FavoriteWithMedia => !!f);
}

export async function searchFavoriteMediaNodes(
  params: SearchFavoriteParams
): Promise<SearchFavoriteResult> {
  const where = buildWhere(params);

  const total = await prisma.favorite.count({ where });

  if (total === 0) {
    return { nodes: [], total: 0 };
  }

  const favorites = params.shuffle
    ? await findShuffledFavorites(params, where)
    : await findSortedFavorites(params, where);

  return {
    nodes: favorites.map(toMediaNode),
    total,
  };
}
