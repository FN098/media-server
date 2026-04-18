"use client";

import { MediaNode, MediaPathToIndexMap } from "@/lib/media/types";
import { useCallback, useMemo } from "react";

export function useMediaIndex(nodes: MediaNode[]) {
  // path -> index
  const indexMap: MediaPathToIndexMap = useMemo(
    () => new Map(nodes.map((n, index) => [n.path, index])),
    [nodes]
  );

  const getMediaIndex = useCallback(
    (path: string) => {
      if (indexMap.has(path)) return indexMap.get(path)!;
      return null;
    },
    [indexMap]
  );

  return {
    getMediaIndex,
  };
}
