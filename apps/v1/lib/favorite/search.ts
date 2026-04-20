import { Prisma } from "@/generated/prisma/client";
import { FavoriteSortKey } from "@/lib/favorite/types";
import {
  RatingFilterMode,
  RatingOperator,
  TagFilterMode,
} from "@/lib/filter/types";
import { detectMediaType } from "@/lib/media/media-types";
import { MediaNode, MediaType, SortDirection } from "@/lib/media/types";
import { prisma } from "@/lib/prisma";
import { normalizeForLike } from "@/lib/utils/search";
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

export async function searchFavoriteMediaNodes(
  params: SearchFavoriteParams
): Promise<SearchFavoriteResult> {
  const { limit: take, seed, shuffle } = params;

  const where = buildWhere(params);
  const orderBy = buildOrderBy(params);
  const select = {
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
  };

  // 並列でクエリ実行
  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({ where, select, orderBy, take }),
    prisma.favorite.count({ where }),
  ]);

  // 結果を加工
  let nodes = favorites.map(
    (f) =>
      ({
        id: f.media.id,
        name: path.basename(f.media.path),
        path: f.media.path,
        type: f.media.type ?? detectMediaType(basename(f.media.path)) ?? "file",
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
      }) satisfies MediaNode
  );

  // limit 後にシャッフル（IDをすべて取得してシャッフルするのは重過ぎるため、シンプルさを優先）
  if (shuffle) {
    nodes = seed ? shuffleArrayWithSeed(nodes, seed) : shuffleArray(nodes);
  }

  return { nodes, total };
}
