import { TrashDialogs } from "@/components/ui/pages/trash/hooks/use-trash-dialogs";
import { TrashNavigation } from "@/components/ui/pages/trash/hooks/use-trash-navigation";
import { TrashSelection } from "@/components/ui/pages/trash/hooks/use-trash-selection";
import { Fullscreen } from "@/hooks/use-fullscreen";
import { ViewerNavigation } from "@/hooks/use-viewer-control";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import {
  ExternalLinkIcon,
  FullscreenIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo } from "react";

interface UseTrashMenuProps {
  selection: TrashSelection;
  dialogs: TrashDialogs;
  navigation: TrashNavigation;
  viewer: ViewerNavigation;
  fullscreen: Fullscreen;
}

export function useTrashMenu({
  selection,
  dialogs,
  navigation,
  viewer,
  fullscreen,
}: UseTrashMenuProps) {
  const { hasSelection, selectedCount } = selection;
  const { deleteDialog, restoreDialog } = dialogs;

  const items: MenuItemDef<NodeContext>[] = useMemo(
    () => [
      {
        key: "openInNewTab",
        type: "action",
        icon: ExternalLinkIcon,
        label: "新しいタブで開く",
        onClick: ({ node }) => navigation.openInNewTab(node),
        hidden: () => selectedCount > 1,
      },
      {
        key: "toggleFullscreen",
        type: "action",
        icon: FullscreenIcon,
        label: "全画面",
        onClick: () => void fullscreen.toggle(),
        hidden: () => !viewer.isOpen || !fullscreen.isSupported,
      },
      {
        key: "restore",
        type: "action",
        icon: RotateCcwIcon,
        label: "復元",
        onClick: ({ node }) =>
          hasSelection
            ? restoreDialog.openSelected()
            : restoreDialog.open(node),
      },
      {
        key: "delete",
        type: "action",
        icon: Trash2Icon,
        variant: "destructive",
        label: "削除",
        onClick: ({ node }) =>
          hasSelection ? deleteDialog.openSelected() : deleteDialog.open(node),
      },
    ],
    [
      navigation,
      selectedCount,
      fullscreen,
      viewer.isOpen,
      hasSelection,
      restoreDialog,
      deleteDialog,
    ]
  );

  return {
    items,
  };
}
