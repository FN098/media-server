import { Tag } from "@/generated/prisma";

export function useTags() {
  // TODO: 表示中の項目に含まれるタグはすべて取得、それ以外は適宜取得
  const tags = ["sample-1", "sample-2", "sample-3"];

  return {
    tags: tags.map((t) => ({
      id: t,
      name: t,
    })) satisfies Tag[],
  };
}
