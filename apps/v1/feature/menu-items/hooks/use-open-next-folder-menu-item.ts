import { IndexLike } from "@/feature/viewer/hooks/use-viewer-navigation";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { MoveRightIcon } from "lucide-react";
import { useMemo } from "react";

interface UseOpenNextFolderMenuItemProps {
  openNextFolder: (at: IndexLike) => void;
  isViewerOpen: boolean;
}

export function useOpenNextFolderMenuItem({
  openNextFolder,
  isViewerOpen,
}: UseOpenNextFolderMenuItemProps): MenuItemDef<NodeContext> {
  return useMemo(
    () => ({
      key: "open-next-folder",
      type: "action",
      icon: MoveRightIcon,
      label: "次のフォルダを開く",
      onClick: () => openNextFolder("first"),
      hidden: () => !isViewerOpen,
      kbd: ["Ctrl", "Right"],
    }),
    [openNextFolder, isViewerOpen]
  );
}
