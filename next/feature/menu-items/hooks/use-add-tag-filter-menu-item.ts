import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { ListFilterPlusIcon } from "lucide-react";
import { useMemo } from "react";

interface UseAddTagFilterMenuItemProps {
  addTagFilter: (nodes: MediaNode[]) => void;
  canAddTagFilter: (nodes: MediaNode[]) => boolean;
  hasSelection: boolean;
  selectedNodes: MediaNode[];
}

export function useAddTagFilterMenuItem({
  addTagFilter,
  canAddTagFilter,
  hasSelection,
  selectedNodes,
}: UseAddTagFilterMenuItemProps): MenuItemDef<NodeContext> {
  return useMemo(
    () => ({
      key: "add-tag-filter",
      type: "action",
      icon: ListFilterPlusIcon,
      label: "タグをフィルターに追加",
      onClick: ({ node }) =>
        addTagFilter(hasSelection ? selectedNodes : [node]),
      disabled: ({ node }) =>
        !canAddTagFilter(hasSelection ? selectedNodes : [node]),
      hidden: ({ node }) => node.isDirectory,
    }),
    [addTagFilter, hasSelection, selectedNodes, canAddTagFilter]
  );
}
