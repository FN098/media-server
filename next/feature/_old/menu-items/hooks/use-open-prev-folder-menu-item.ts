import { MenuItemDef, NodeContext } from "@/feature/menu-items/lib/types";
import { IndexLike } from "@/feature/viewer/hooks/use-viewer";
import { MoveLeftIcon } from "lucide-react";
import { useMemo } from "react";

interface UseOpenPrevFolderMenuItemProps {
  openPrevFolder: (at: IndexLike) => void;
  isViewerOpen: boolean;
}

export function useOpenPrevFolderMenuItem({
  openPrevFolder,
  isViewerOpen,
}: UseOpenPrevFolderMenuItemProps): MenuItemDef<NodeContext> {
  return useMemo(
    () => ({
      key: "open-prev-folder",
      type: "action",
      icon: MoveLeftIcon,
      label: "前のフォルダを開く",
      onClick: () => openPrevFolder("first"),
      hidden: () => !isViewerOpen,
      kbd: ["Ctrl", "Left"],
    }),
    [openPrevFolder, isViewerOpen]
  );
}
