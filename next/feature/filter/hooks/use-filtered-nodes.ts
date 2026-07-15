import { MediaNode } from "@/lib/media/types";
import { useMemo } from "react";

type Pipe = (node: MediaNode) => boolean;

interface UseFilteredNodesProps {
  targets: MediaNode[];
  pipeline: Pipe[];
  activated?: boolean;
}

export function useFilteredNodes({
  targets,
  pipeline,
  activated = true,
}: UseFilteredNodesProps) {
  // フィルタリング実行
  const filtered = useMemo(() => {
    if (!activated) return targets;

    // フィルタの適用
    return targets.filter((node) => pipeline.every((filter) => filter(node)));
  }, [activated, targets, pipeline]);

  return {
    filtered,
    filteredCount: filtered.length,
    totalCount: targets.length,
    isFiltered: filtered.length !== targets.length,
  };
}
