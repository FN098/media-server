import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { RefreshCwIcon } from "lucide-react";
import { useMemo } from "react";

interface UseUpdateThumbMenuItemProps {
  updateThumbs: (nodes: MediaNode[]) => void | Promise<void>;
  updateThumb: (node: MediaNode) => void | Promise<void>;
  isViewerOpen: boolean;
  hasSelection: boolean;
  selectedNodes: MediaNode[];
}

export function useUpdateThumbMenuItem({
  updateThumbs,
  updateThumb,
  isViewerOpen,
  hasSelection,
  selectedNodes,
}: UseUpdateThumbMenuItemProps): MenuItemDef<NodeContext> {
  return useMemo(
    () => ({
      key: "update-thumb",
      type: "action",
      icon: RefreshCwIcon,
      label: "サムネイルを更新",
      onClick: ({ node }) =>
        hasSelection
          ? void updateThumbs(selectedNodes)
          : void updateThumb(node),
      hidden: () => isViewerOpen,
    }),
    [hasSelection, updateThumbs, selectedNodes, updateThumb, isViewerOpen]
  );
}
