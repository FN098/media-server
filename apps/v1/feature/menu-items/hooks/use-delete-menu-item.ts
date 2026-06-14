import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { Trash2Icon } from "lucide-react";
import { useMemo } from "react";

interface UseDeleteMenuItemProps {
  openDialog: (nodes: MediaNode[]) => void;
  hasSelection: boolean;
  selectedNodes: MediaNode[];
}

export function useDeleteMenuItem({
  openDialog,
  hasSelection,
  selectedNodes,
}: UseDeleteMenuItemProps): MenuItemDef<NodeContext> {
  return useMemo(
    () => ({
      key: "delete",
      type: "action",
      icon: Trash2Icon,
      variant: "destructive",
      label: "削除",
      onClick: ({ node }) => openDialog(hasSelection ? selectedNodes : [node]),
      kbd: "Del",
    }),
    [hasSelection, openDialog, selectedNodes]
  );
}
