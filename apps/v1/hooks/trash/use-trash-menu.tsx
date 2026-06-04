import { Fullscreen } from "@/hooks/general/use-fullscreen";
import { ViewerNavigation } from "@/hooks/navigations/use-viewer-navigation";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { TrashDialogs } from "@/hooks/trash/use-trash-dialogs";
import { TrashNavigation } from "@/hooks/trash/use-trash-navigation";
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

interface TrashMenuContext {
  selection: MediaNodeSelection;
  dialogs: TrashDialogs;
  navigation: TrashNavigation;
  viewer: ViewerNavigation;
  fullscreen: Fullscreen;
}

function createTrashMenuItems({
  selection,
  dialogs,
  navigation,
  viewer,
  fullscreen,
}: TrashMenuContext): MenuItemDef<NodeContext>[] {
  return [
    {
      key: "open-in-new-tab",
      type: "action",
      icon: ExternalLinkIcon,
      label: "新しいタブで開く",
      onClick: ({ node }) => navigation.openInNewTab(node),
      hidden: () => selection.selectedCount > 1,
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
      key: "toggle-fullscreen",
      type: "action",
      icon: FullscreenIcon,
      label: "全画面",
      onClick: () => void fullscreen.toggle(),
      hidden: () => !viewer.isOpen || !fullscreen.isSupported,
      kbd: "F",
    },
    {
      key: "separator-fs-operation",
      type: "separator",
    },
    {
      key: "restore",
      type: "action",
      icon: RotateCcwIcon,
      label: "復元",
      onClick: ({ node }) =>
        dialogs.restoreDialog.open(
          selection.hasSelection ? selection.selectedNodes : [node]
        ),
    },
    {
      key: "delete",
      type: "action",
      icon: Trash2Icon,
      variant: "destructive",
      label: "削除",
      onClick: ({ node }) =>
        dialogs.deleteDialog.open(
          selection.hasSelection ? selection.selectedNodes : [node],
          {
            isPermanent: true,
          }
        ),
      kbd: "Del",
    },
  ];
}

export function useTrashMenu(context: TrashMenuContext) {
  const items = useMemo(() => {
    return createTrashMenuItems(context);
  }, [context]);

  return {
    items,
  };
}
