"use client";

import { MediaNode, MediaPathToIndexMap } from "@/lib/media/types";
import { IndexLike } from "@/lib/query/types";
import { useCallback, useMemo } from "react";

const normalizeIndex = (at: IndexLike, total: number) => {
  if (at === "first") return 0;
  if (at === "last") return total - 1;

  const index = Number(at);
  if (Number.isNaN(index)) return 0;

  return index;
};

export function useViewerControl({
  mediaOnly,
  at,
  modal,
}: {
  mediaOnly: MediaNode[];
  at?: IndexLike | null;
  modal?: boolean | null;
}) {
  // ビューア用インデックスを計算するためのマップ
  const indexMap: MediaPathToIndexMap = useMemo(
    () => new Map(mediaOnly.map((n, index) => [n.path, index])),
    [mediaOnly]
  );

  // ビューア用インデックスを取得
  const getViewerIndex = useCallback(
    (path: string) => {
      if (indexMap.has(path)) return indexMap.get(path)!;
      return null;
    },
    [indexMap]
  );

  // 初期インデックス
  const initialIndex = useMemo(
    () => (at != null ? normalizeIndex(at, mediaOnly.length) : 0),
    [at, mediaOnly.length]
  );

  // ビューア起動モード
  const isViewMode = modal && initialIndex != null && !!mediaOnly[initialIndex];

  return {
    initialIndex,
    getViewerIndex,
    isViewMode,
  };
}
