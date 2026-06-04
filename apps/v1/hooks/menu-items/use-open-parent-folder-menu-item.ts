import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { FolderIcon } from "lucide-react";
import { useMemo } from "react";

interface UseOpenParentFolderMenuItemProps {
  openParentFolder: (node: MediaNode) => void;
  selectedCount: number;
}

export function useOpenParentFolderMenuItem({
  openParentFolder,
  selectedCount,
}: UseOpenParentFolderMenuItemProps): MenuItemDef<NodeContext> {
  return useMemo(
    () => ({
      key: "open-folder",
      type: "action",
      icon: FolderIcon,
      label: "フォルダを開く",
      onClick: ({ node }) => openParentFolder(node),
      hidden: () => selectedCount > 1,
      kbd: "O",
    }),
    [openParentFolder, selectedCount]
  );
}
