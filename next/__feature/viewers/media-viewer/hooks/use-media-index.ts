import { Node } from "@/lib/node/types";
import { useCallback, useMemo } from "react";

export function useNodeIndex(nodes: Node[]) {
  // id -> index
  const indexMap: Map<string, number> = useMemo(
    () => new Map(nodes.map((n, index) => [n.id, index])),
    [nodes]
  );

  const getNodeIndex = useCallback(
    (id: string) => {
      if (indexMap.has(id)) return indexMap.get(id)!;
      return null;
    },
    [indexMap]
  );

  return {
    getNodeIndex,
  };
}
