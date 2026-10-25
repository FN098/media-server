import { Fullscreen } from "@/__feature/general/hooks/use-fullscreen";
import { useDeletePermanentlyMenuItem } from "@/__feature/menu-items/hooks/use-delete-permanently-menu-item";
import { useOpenInNewTabMenuItem } from "@/__feature/menu-items/hooks/use-open-in-new-tab-menu-item";
import { useOpenNextFolderMenuItem } from "@/__feature/menu-items/hooks/use-open-next-folder-menu-item";
import { useOpenPrevFolderMenuItem } from "@/__feature/menu-items/hooks/use-open-prev-folder-menu-item";
import { useRestoreMenuItem } from "@/__feature/menu-items/hooks/use-restore-menu-item";
import { useToggleFullscreenMenuItem } from "@/__feature/menu-items/hooks/use-toggle-fullscreen-menu-item";
import { TrashDialogs } from "@/__feature/pages/trash/hooks/use-trash-dialogs";
import { TrashNavigation } from "@/__feature/pages/trash/hooks/use-trash-navigation";
import { NodeSelectionControl } from "@/__feature/selection/hooks/use-node-selection-control";
import { createSeparator } from "@/__lib/menu-items/factory";
import { MenuItemDef, NodeContext } from "@/__lib/menu-items/types";
import { ViewerNavigation } from "@/feature/viewer/hooks/use-viewer";

export const separators = {
  actions: createSeparator("sep-actions"),
  file: createSeparator("sep-file"),
  delete: createSeparator("sep-delete"),
} as const;

interface UseTrashMenuItemsProps {
  selection: NodeSelectionControl;
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

  const deleteNode = useDeletePermanentlyMenuItem({
    openDialog: (nodes) =>
      dialogs.deleteDialog.open(nodes, { isPermanent: true }),
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
