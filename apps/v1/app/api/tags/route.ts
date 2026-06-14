import { authorize } from "@/lib/authorization/authorize";
import { logger } from "@/lib/logger";
import {
  badRequestResponse,
  forbiddenResponse,
  internalServerErrorResponse,
} from "@/lib/response/errors";
import {
  getFavoriteTags,
  getRelatedTags,
  getTagsByIds,
} from "@/lib/tag/repository";
import {
  SearchTagsRequestParams,
  SearchTagsRequestParamsSchema,
} from "@/lib/tag/schemas";
import { searchTags } from "@/lib/tag/search";
import { uniqueBy } from "@/lib/utils/array";
import { safeParseRequestJson } from "@/lib/utils/request";
import { NextRequest } from "next/server";

// タグ検索
export async function POST(request: NextRequest) {
  // 入力バリデーション
  const json = await safeParseRequestJson(request);
  const parsed = SearchTagsRequestParamsSchema.safeParse(json);
  if (!parsed.success) {
    return badRequestResponse({
      code: "INVALID_REQUEST",
      message: parsed.error.message,
    });
  }

  const params = parsed.data;

  // 認証＋認可
  const auth = await authorize("tag:search");
  if (!auth.success) {
    return forbiddenResponse();
  }

  try {
    const result = await process(params);
    return Response.json(result);
  } catch (error) {
    logger.error("api:search-tags", error);
    return internalServerErrorResponse();
  }
}

async function process({
  ids,
  paths,
  limit,
  query,
  strategy,
}: SearchTagsRequestParams) {
  // ID 直接指定
  if (strategy === "ids-only") {
    const tags = await getTagsByIds(ids, { limit });
    return tags;
  }

  // 関連タグのみ
  if (strategy === "related-only") {
    const relatedTags = await getRelatedTags(paths, { limit });
    return relatedTags;
  }

  // お気に入りタグのみ
  if (strategy === "favorite-only") {
    const favoriteTags = await getFavoriteTags({ limit });
    return favoriteTags;
  }

  // 関連タグは必ず取得
  const relatedTags = await getRelatedTags(paths, { limit });
  const excludeIds = relatedTags.map((t) => t.id);
  const remain = limit - relatedTags.length;

  const foundTags = await searchTags({
    excludeIds,
    limit: remain,
    query,
    strategy,
  });

  // マージ
  const combined = [...relatedTags, ...foundTags];

  // IDでユニークにする
  const uniqueTags = uniqueBy(combined, "id");

  return uniqueTags.slice(0, limit);
}
