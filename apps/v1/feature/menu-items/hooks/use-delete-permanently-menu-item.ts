import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { Trash2Icon } from "lucide-react";
import { useMemo } from "react";

interface UseDeletePermanentlyMenuItemProps {
  openDialog: (nodes: MediaNode[]) => void;
  hasSelection: boolean;
  selectedNodes: MediaNode[];
}

export function useDeletePermanentlyMenuItem({
  openDialog,
  hasSelection,
  selectedNodes,
}: UseDeletePermanentlyMenuItemProps): MenuItemDef<NodeContext> {
  return useMemo(
    () => ({
      key: "delete",
      type: "action",
      icon: Trash2Icon,
      variant: "destructive",
      label: "完全に削除",
      onClick: ({ node }) => openDialog(hasSelection ? selectedNodes : [node]),
      kbd: ["Shift", "Del"],
    }),
    [hasSelection, openDialog, selectedNodes]
  );
}
