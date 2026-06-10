import { MediaNode } from "@/lib/media/types";
import { useCallback, useMemo } from "react";

export function useMediaIndex(nodes: MediaNode[]) {
  // path -> index
  const indexMap: Map<string, number> = useMemo(
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
