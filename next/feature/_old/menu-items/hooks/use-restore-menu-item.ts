import { MenuItemDef, NodeContext } from "@/feature/menu-items/lib/types";
import { MediaNode } from "@/lib/node/types";
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
