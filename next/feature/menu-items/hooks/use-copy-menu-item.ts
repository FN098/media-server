import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { MediaNode } from "@/lib/node/types";
import { CopyIcon } from "lucide-react";
import { useMemo } from "react";

interface UseCopyMenuItemProps {
  openDialog: (nodes: MediaNode[], dirPath: string) => void;
  hasSelection: boolean;
  selectedNodes: MediaNode[];
  currentDirPath: string;
}

export function useCopyMenuItem({
  openDialog,
  hasSelection,
  selectedNodes,
  currentDirPath,
}: UseCopyMenuItemProps): MenuItemDef<NodeContext> {
  return useMemo(
    () => ({
      key: "copy",
      type: "action",
      icon: CopyIcon,
      label: "コピー",
      onClick: ({ node }) =>
        openDialog(hasSelection ? selectedNodes : [node], currentDirPath),
      kbd: "F8",
    }),
    [openDialog, hasSelection, selectedNodes, currentDirPath]
  );
}
