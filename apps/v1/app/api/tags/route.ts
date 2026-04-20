import { MAX_PATHS_TO_PROCESS, MAX_RETURN_TAGS_COUNT } from "@/lib/tag/limits";
import {
  getFavoriteTags,
  getRelatedTags,
  getTagsByIds,
} from "@/lib/tag/repository";
import { searchTags } from "@/lib/tag/search";
import { searchTagStrategies } from "@/lib/tag/strategies";
import { uniqueBy } from "@/lib/utils/array";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const RequestSchema = z.object({
  query: z.string().optional(),
  paths: z.array(z.string()).optional().default([]),
  ids: z.array(z.string()).optional().default([]),
  strategy: z.enum(searchTagStrategies).optional().default("default"),
  limit: z.coerce.number().optional().default(MAX_RETURN_TAGS_COUNT),
});

type RequestParams = z.infer<typeof RequestSchema>;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const rawPaths = searchParams.get("paths");
    const parsed = RequestSchema.safeParse(
      rawPaths ? JSON.parse(rawPaths) : []
    );

    if (!parsed.success) {
      return new NextResponse("Invalid paths format", { status: 400 });
    }

    const result = await process(parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Tag Fetch Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// paths が多い場合、GET だとエラーになる可能性があるので POST も用意しておく
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const result = await process(parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Tag Fetch Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function process(params: RequestParams) {
  const { ids, paths: pathsRaw, limit, query, strategy } = params;

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
