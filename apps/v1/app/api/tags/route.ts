import { Tag } from "@/lib/tag/types";
import { getPopularTags, getRelatedTags } from "@/repositories/tag-repository";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const MAX_RETURN_TAGS_COUNT = 100;
const MAX_PATHS_TO_PROCESS = 500;

const RequestSchema = z.object({
  paths: z.array(z.string()).optional().default([]),
});

async function getTags(paths: string[]): Promise<Tag[]> {
  // 1. 関連タグの取得
  const relatedTags = await getRelatedTags(paths, {
    limit: MAX_RETURN_TAGS_COUNT,
  });

  // 2. その他（人気）タグの取得
  const excludeIds = relatedTags.map((t) => t.id);
  const popularTags = await getPopularTags({
    excludeIds,
    limit: MAX_RETURN_TAGS_COUNT,
  });

  // 3. マージ
  const result = [...relatedTags, ...popularTags];

  return result;
}

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
    const result = await getTags(paths);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Tag Fetch Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    // パスが多すぎる場合は、先頭からカットして処理（DB負荷対策）
    const paths = parsed.data.paths.slice(0, MAX_PATHS_TO_PROCESS);
    const result = await getTags(paths);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Tag Fetch Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
