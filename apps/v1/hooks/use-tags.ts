import { Tag } from "@/generated/prisma";

export function useTags() {
  const tags = ["sample-1", "sample-2", "sample-3"];

  return {
    tags: tags.map((t) => ({
      id: t,
      name: t,
    })) satisfies Tag[],
  };
}
