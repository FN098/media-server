import { Tag } from "@/lib/tag/types";
import { getPopularTags, getRelatedTags } from "@/repositories/tag-repository";

export async function searchTags(
  paths: string[],
  options?: {
    limit?: number;
    strategy?: "most-used" | "most-recently-used";
  }
): Promise<Tag[]> {
  const limit = options?.limit;

  // 1. 関連タグの取得
  const relatedTags = await getRelatedTags(paths, {
    limit,
  });

  const remain = limit !== undefined ? limit - relatedTags.length : undefined;

  // 2. その他（人気）タグの取得
  const excludeIds = relatedTags.map((t) => t.id);
  const popularTags = await getPopularTags({
    excludeIds,
    limit: remain,
  });

  // 3. マージ
  const result = [...relatedTags, ...popularTags];

  return result;
}
