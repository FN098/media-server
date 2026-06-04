import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { FolderInputIcon } from "lucide-react";
import { useMemo } from "react";

interface UseMoveMenuItemProps {
  openDialog: (nodes: MediaNode[], dirPath: string) => void;
  hasSelection: boolean;
  selectedNodes: MediaNode[];
  currentDirPath: string;
}

export function useMoveMenuItem({
  openDialog,
  hasSelection,
  selectedNodes,
  currentDirPath,
}: UseMoveMenuItemProps): MenuItemDef<NodeContext> {
  return useMemo(
    () => ({
      key: "move",
      type: "action",
      icon: FolderInputIcon,
      label: "移動",
      onClick: ({ node }) =>
        openDialog(hasSelection ? selectedNodes : [node], currentDirPath),
    }),
    [openDialog, hasSelection, selectedNodes, currentDirPath]
  );
}
