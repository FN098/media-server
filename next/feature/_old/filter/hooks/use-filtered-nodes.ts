import { Node } from "@/lib/node/types";
import { useMemo } from "react";

type Filter = (node: Node) => boolean;

interface UseFilteredNodesProps {
  nodes: Node[];
  filters: Filter[];
  activated?: boolean;
}

export function useFilteredNodes({
  nodes,
  filters,
  activated = true,
}: UseFilteredNodesProps) {
  // フィルタリング実行
  const filteredNodes = useMemo(() => {
    if (!activated) return nodes;

    // フィルタの適用
    return nodes.filter((node) => filters.every((filter) => filter(node)));
  }, [activated, nodes, filters]);

  return {
    filteredNodes,
    filteredCount: filteredNodes.length,
    totalCount: nodes.length,
    isFiltered: filteredNodes.length !== nodes.length,
  };
}
