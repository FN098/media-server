import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { RotateCcwIcon } from "lucide-react";
import { useMemo } from "react";

interface UseRestoreMenuItemProps {
  openDialog: (nodes: MediaNode[]) => void;
  hasSelection: boolean;
  selectedNodes: MediaNode[];
}

export function useRestoreMenuItem({
  openDialog,
  hasSelection,
  selectedNodes,
}: UseRestoreMenuItemProps): MenuItemDef<NodeContext> {
  return useMemo(
    () => ({
      key: "restore",
      type: "action",
      icon: RotateCcwIcon,
      label: "復元",
      onClick: ({ node }) => openDialog(hasSelection ? selectedNodes : [node]),
    }),
    [hasSelection, openDialog, selectedNodes]
  );
}
