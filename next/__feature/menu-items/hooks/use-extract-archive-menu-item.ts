import { isArchiveFile } from "@/__lib/archive/archive-types";
import { MenuItemDef, NodeContext } from "@/feature/menu-items/lib/types";
import { MediaNode } from "@/lib/node/types";
import { PackageOpenIcon } from "lucide-react";
import { useMemo } from "react";

interface UseExtractArchiveMenuItemProps {
  openDialog: (nodes: MediaNode[]) => void;
  hasSelection: boolean;
  selectedNodes: MediaNode[];
}

export function useExtractArchiveMenuItem({
  openDialog,
  hasSelection,
  selectedNodes,
}: UseExtractArchiveMenuItemProps): MenuItemDef<NodeContext> {
  return useMemo(
    () => ({
      key: "extract-archive",
      type: "action",
      icon: PackageOpenIcon,
      label: "解凍",
      onClick: ({ node }) => openDialog(hasSelection ? selectedNodes : [node]),
      hidden: ({ node }) => !isArchiveFile(node.path),
    }),
    [openDialog, hasSelection, selectedNodes]
  );
}
