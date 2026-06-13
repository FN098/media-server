import { Fullscreen } from "@/hooks/general/use-fullscreen";
import { useDeleteMenuItem } from "@/hooks/menu-items/use-delete-menu-item";
import { useOpenInNewTabMenuItem } from "@/hooks/menu-items/use-open-in-new-tab-menu-item";
import { useOpenNextFolderMenuItem } from "@/hooks/menu-items/use-open-next-folder-menu-item";
import { useOpenPrevFolderMenuItem } from "@/hooks/menu-items/use-open-prev-folder-menu-item";
import { useRestoreMenuItem } from "@/hooks/menu-items/use-restore-menu-item";
import { useToggleFullscreenMenuItem } from "@/hooks/menu-items/use-toggle-fullscreen-menu-item";
import { ViewerNavigation } from "@/hooks/navigation/use-viewer-navigation";
import { TrashDialogs } from "@/hooks/pages/trash/use-trash-dialogs";
import { TrashNavigation } from "@/hooks/pages/trash/use-trash-navigation";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { createSeparator } from "@/lib/menu-items/factory";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";

export const separators = {
  actions: createSeparator("sep-actions"),
  file: createSeparator("sep-file"),
  delete: createSeparator("sep-delete"),
} as const;

interface UseTrashMenuItemsProps {
  selection: MediaNodeSelection;
  dialogs: TrashDialogs;
  navigation: TrashNavigation;
  viewer: ViewerNavigation;
  fullscreen: Fullscreen;
}

export function useTrashMenuItems({
  selection,
  dialogs,
  navigation,
  viewer,
  fullscreen,
}: UseTrashMenuItemsProps): MenuItemDef<NodeContext>[] {
  const openInNewTab = useOpenInNewTabMenuItem({
    openInNewTab: navigation.openInNewTab,
    selectedCount: selection.selectedCount,
  });

  const openNextFolder = useOpenNextFolderMenuItem({
    openNextFolder: navigation.openNextFolder,
    isViewerOpen: viewer.isOpen,
  });

  const openPrevFolder = useOpenPrevFolderMenuItem({
    openPrevFolder: navigation.openPrevFolder,
    isViewerOpen: viewer.isOpen,
  });

  const toggleFullscreen = useToggleFullscreenMenuItem({
    toggleFullscreen: fullscreen.toggle,
    isFullscreenSupported: fullscreen.isSupported,
    isViewerOpen: viewer.isOpen,
  });

  const restore = useRestoreMenuItem({
    openDialog: dialogs.restoreDialog.open,
    hasSelection: selection.hasSelection,
    selectedNodes: selection.selectedNodes,
  });

  const deleteNode = useDeleteMenuItem({
    openDialog: dialogs.deleteDialog.open,
    hasSelection: selection.hasSelection,
    selectedNodes: selection.selectedNodes,
  });

  return [
    separators.actions,
    openInNewTab,
    openNextFolder,
    openPrevFolder,
    toggleFullscreen,
    separators.file,
    restore,
    separators.delete,
    deleteNode,
  ];
}
