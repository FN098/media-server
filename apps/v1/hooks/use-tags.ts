"use client";

import { SearchTagsRequestParams, Tag } from "@/lib/tag/types";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

interface Options extends SearchTagsRequestParams {
  triggered?: boolean;
  onLoad?: (tags: Tag[]) => void;
}

export function useTags(options: Options) {
  const queryClient = useQueryClient();
  const { triggered = true, onLoad, ...apiRequestParams } = options;

  const { data, refetch, isLoading, isPlaceholderData, isFetching } = useQuery({
    queryKey: ["tags", apiRequestParams],
    queryFn: async () => {
      const res = await fetch("/api/tags", {
        method: "POST", // GET だと URL の長さに制約があるので POST を使う
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiRequestParams),
      });
      if (!res.ok) throw new Error("Failed to fetch tags");
      return res.json() as Promise<Tag[]>;
    },
    enabled: triggered,
    // staleTime: 1000 * 60 * 5, // 5分間はキャッシュを利用
    placeholderData: keepPreviousData,
  });

  // フェッチ完了時にコールバックを呼ぶ（onSuccess 相当）
  const prevDataRef = useRef<Tag[] | undefined>(undefined);

  useEffect(() => {
    if (data !== undefined && data !== prevDataRef.current) {
      prevDataRef.current = data;
      onLoad?.(data);
    }
  }, [data, onLoad]);

  // キャッシュを無効化する関数をメモ化して提供
  const invalidate = useCallback(async () => {
    // "tags" で始まる全てのクエリ（他のパスの組み合わせも含む）を無効化
    await queryClient.invalidateQueries({ queryKey: ["tags"] });
  }, [queryClient]);

  return {
    tags: data ?? [],
    refetch, // 特定のこのクエリだけをリフェッチ
    invalidate, // タグ関連の全キャッシュを無効化（保存後などに使用）
    isLoading: (isLoading && triggered) || isPlaceholderData || isFetching,
  };
}
