import { useFiltering } from "@/feature/explorer-page/hooks/use-filtering";
import { useNodeListingContext } from "@/feature/listing/providers/node-listing-provider";
import { useNodeSelection } from "@/feature/selection/hooks/use-node-selection";

export function useExplorerSelection() {
  const { children: allNodes } = useNodeListingContext();
  const { filteredNodes: activeNodes } = useFiltering();
  return useNodeSelection({ allNodes, activeNodes });
}

export type ExplorerSelection = ReturnType<typeof useExplorerSelection>;
