import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { TagEditorControl } from "@/hooks/tag-editor/use-tag-editor-control";
import { TrashDialogs } from "@/hooks/trash/use-trash-dialogs";
import { MenuItemDef, MultipleNodesContext } from "@/lib/menu-items/types";
import { RotateCcwIcon, TagIcon, Trash2Icon } from "lucide-react";
import { useMemo } from "react";

interface UseTrashSelectionBarProps {
  selection: MediaNodeSelection;
  dialogs: TrashDialogs;
  tagEditor: TagEditorControl;
}

export function useTrashSelectionBar({
  selection,
  dialogs,
  tagEditor,
}: UseTrashSelectionBarProps) {
  const { hasSelection, selectedNodes } = selection;
  const { deleteDialog, restoreDialog } = dialogs;

  const inlineMenuItems: MenuItemDef<MultipleNodesContext>[] = useMemo(
    () => [
      {
        key: "editTags",
        type: "action",
        icon: TagIcon,
        label: "タグ編集",
        onClick: tagEditor.open,
      },
    ],
    [tagEditor.open]
  );

  const menuItems = useMemo(
    () =>
      [
        {
          key: "restore",
          type: "action",
          icon: RotateCcwIcon,
          label: "復元",
          onClick: () => restoreDialog.open(selectedNodes),
          disabled: () => !hasSelection,
        },
        {
          key: "delete",
          type: "action",
          variant: "destructive",
          icon: Trash2Icon,
          label: "削除",
          onClick: () =>
            deleteDialog.open(selectedNodes, { isPermanent: true }),
          disabled: () => !hasSelection,
        },
      ] satisfies MenuItemDef<MultipleNodesContext>[],
    [restoreDialog, selectedNodes, deleteDialog, hasSelection]
  );

  return {
    menu: {
      items: menuItems,
      inlineItems: inlineMenuItems,
    },
  };
}
