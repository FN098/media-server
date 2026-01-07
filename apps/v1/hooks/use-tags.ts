"use client";

import { SearchTagsRequestParams, Tag } from "@/lib/tag/types";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";

export function useTags(params: SearchTagsRequestParams) {
  const queryClient = useQueryClient();

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
    // staleTime: 1000 * 60 * 5, // 5分間はキャッシュを利用
    placeholderData: keepPreviousData,
  });

  // キャッシュを無効化する関数をメモ化して提供
  const invalidateTags = useCallback(async () => {
    // "tags" で始まる全てのクエリ（他のパスの組み合わせも含む）を無効化
    await queryClient.invalidateQueries({ queryKey: ["tags"] });
  }, [queryClient]);

  return {
    tags: data ?? [],
    refreshTags: refetch, // 特定のこのクエリだけをリフェッチ
    invalidateTags, // タグ関連の全キャッシュを無効化（保存後などに使用）
    isLoading: isLoading || isPlaceholderData,
  };
}
