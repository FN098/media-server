import { logger } from "@/lib/logger";
import {
  badRequestResponse,
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
import { NextRequest, NextResponse } from "next/server";

const MAX_PATHS_TO_PROCESS = 500;

// タグを検索：検索パラメータが複雑なので、GETではなくPOSTで実装
export async function POST(request: NextRequest) {
  // 入力バリデーション
  const json = await safeParseRequestJson(request);
  const parsed = {
    params: SearchTagsRequestParamsSchema.safeParse(json),
  };

  if (!parsed.params.success) {
    return badRequestResponse({ message: "Invalid input" });
  }

  try {
    const result = await process(parsed.params.data);

    return NextResponse.json(result);
  } catch (error) {
    logger.error("api:search-tags", error);
    return internalServerErrorResponse();
  }
}

async function process({
  ids,
  paths: pathsRaw,
  limit,
  query,
  strategy,
}: SearchTagsRequestParams) {
  // ID 直接指定
  if (strategy === "ids-only") {
    const tags = await getTagsByIds(ids, { limit });
    return tags;
  }

  // パスが多すぎる場合は、先頭からカットして処理（DB負荷対策）
  const paths = pathsRaw.slice(0, MAX_PATHS_TO_PROCESS);

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

  // === これ移行は strategy に合わせて検索 ===

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
