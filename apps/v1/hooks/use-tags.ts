"use client";

import { SearchTagsRequestParams, Tag } from "@/lib/tag/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export function useTags(params: SearchTagsRequestParams) {
  const { data, refetch, isLoading, isPlaceholderData } = useQuery({
    queryKey: ["tags", params],
    queryFn: async () => {
      const res = await fetch("/api/tags", {
        method: "POST", // GET だと URL の長さに制約があるので POST を使う
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error("Failed to fetch tags");
      return res.json() as Promise<Tag[]>;
    },
    staleTime: 1000 * 60 * 5, // 5分間はキャッシュを利用
    placeholderData: keepPreviousData,
  });

  return {
    tags: data ?? [],
    refreshTags: refetch,
    isLoading: isLoading || isPlaceholderData,
  };
}
