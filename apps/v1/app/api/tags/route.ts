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
  const { paths: pathsRaw, limit, query, strategy } = params;

  // パスが多すぎる場合は、先頭からカットして処理（DB負荷対策）
  const paths = pathsRaw.slice(0, MAX_PATHS_TO_PROCESS);

  // 1. 関連タグの取得
  const relatedTags = await getRelatedTags(paths, { limit });

  if (strategy === "related-only") return relatedTags;

  const excludeIds = relatedTags.map((t) => t.id);
  const remain = limit - relatedTags.length;

  // 2. その他（人気）タグの取得
  const popularTags = await searchTags({
    excludeIds,
    limit: remain,
    query,
    strategy,
  });

  // 3. マージ
  const merged = [...relatedTags, ...popularTags];

  return merged;
}
