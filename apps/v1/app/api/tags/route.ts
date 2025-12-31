import { MAX_PATHS_TO_PROCESS, MAX_RETURN_TAGS_COUNT } from "@/lib/tag/limits";
import { searchTags } from "@/lib/tag/search";
import { searchTagStrategies } from "@/lib/tag/strategies";
import { getRelatedTags } from "@/repositories/tag-repository";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const RequestSchema = z.object({
  query: z.string().optional(),
  paths: z.array(z.string()).optional().default([]),
  strategy: z.enum(searchTagStrategies).optional(),
  limit: z.coerce.number().optional().default(MAX_RETURN_TAGS_COUNT),
});

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

    // パスが多すぎる場合は、先頭からカットして処理（DB負荷対策）
    const paths = parsed.data.paths.slice(0, MAX_PATHS_TO_PROCESS);

    const limit = MAX_RETURN_TAGS_COUNT;

    // 1. 関連タグの取得
    const relatedTags = await getRelatedTags(paths, { limit });

    const excludeIds = relatedTags.map((t) => t.id);
    const remain = limit - relatedTags.length;

    // 2. その他（人気）タグの取得
    const popularTags = await searchTags({
      excludeIds,
      limit: remain,
      query: parsed.data.query,
      strategy: parsed.data.strategy,
    });

    // 3. マージ
    const result = [...relatedTags, ...popularTags];

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

    // パスが多すぎる場合は、先頭からカットして処理（DB負荷対策）
    const paths = parsed.data.paths.slice(0, MAX_PATHS_TO_PROCESS);

    const limit = parsed.data.limit;

    // 1. 関連タグの取得
    const relatedTags = await getRelatedTags(paths, { limit });

    const excludeIds = relatedTags.map((t) => t.id);
    const remain = limit - relatedTags.length;

    // 2. その他（人気）タグの取得
    const popularTags = await searchTags({
      excludeIds,
      limit: remain,
      query: parsed.data.query,
      strategy: parsed.data.strategy,
    });

    // 3. マージ
    const result = [...relatedTags, ...popularTags];

    return NextResponse.json(result);
  } catch (error) {
    console.error("Tag Fetch Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
