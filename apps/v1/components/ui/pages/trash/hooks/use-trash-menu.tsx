import { TrashDialogs } from "@/components/ui/pages/trash/hooks/use-trash-dialogs";
import { TrashNavigation } from "@/components/ui/pages/trash/hooks/use-trash-navigation";
import { TrashSelection } from "@/components/ui/pages/trash/hooks/use-trash-selection";
import { Fullscreen } from "@/hooks/general/use-fullscreen";
import { ViewerNavigation } from "@/hooks/navigations/use-viewer-navigation";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import {
  ExternalLinkIcon,
  FullscreenIcon,
  MoveLeftIcon,
  MoveRightIcon,
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
  const { hasSelection, selectedCount, selectedNodes } = selection;
  const { deleteDialog, restoreDialog } = dialogs;

  const items: MenuItemDef<NodeContext>[] = useMemo(
    () => [
      {
        key: "open-in-new-tab",
        type: "action",
        icon: ExternalLinkIcon,
        label: "新しいタブで開く",
        onClick: ({ node }) => navigation.openInNewTab(node),
        hidden: () => selectedCount > 1,
      },
      {
        key: "toggle-fullscreen",
        type: "action",
        icon: FullscreenIcon,
        label: "全画面",
        onClick: () => void fullscreen.toggle(),
        hidden: () => !viewer.isOpen || !fullscreen.isSupported,
        kbd: "F",
      },
      {
        key: "goto-next-folder",
        type: "action",
        icon: MoveRightIcon,
        label: "次のフォルダを開く",
        onClick: () => navigation.openNextFolder("first"),
        hidden: () => !viewer.isOpen,
        kbd: ["Ctrl", "Right"],
      },
      {
        key: "goto-prev-folder",
        type: "action",
        icon: MoveLeftIcon,
        label: "前のフォルダを開く",
        onClick: () => navigation.openPrevFolder("first"),
        hidden: () => !viewer.isOpen,
        kbd: ["Ctrl", "Left"],
      },
      {
        key: "restore",
        type: "action",
        icon: RotateCcwIcon,
        label: "復元",
        onClick: ({ node }) =>
          restoreDialog.open(hasSelection ? selectedNodes : [node]),
      },
      {
        key: "delete",
        type: "action",
        icon: Trash2Icon,
        variant: "destructive",
        label: "削除",
        onClick: ({ node }) =>
          deleteDialog.open(hasSelection ? selectedNodes : [node]),
        kbd: "Del",
      },
    ],
    [
      navigation,
      selectedCount,
      fullscreen,
      viewer.isOpen,
      restoreDialog,
      hasSelection,
      selectedNodes,
      deleteDialog,
    ]
  );

  return {
    items,
  };
}
