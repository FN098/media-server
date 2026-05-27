import { TrashDialogs } from "@/components/ui/pages/trash/hooks/use-trash-dialogs";
import { TagEditorControl } from "@/hooks/use-tag-editor-control";
import { MenuItemDef, MultipleNodesContext } from "@/lib/menu-items/types";
import { RotateCcwIcon, TagIcon, Trash2Icon } from "lucide-react";
import { useMemo } from "react";

interface UseTrashSelectionbarProps {
  dialogs: TrashDialogs;
  tagEditor: TagEditorControl;
}

export function useTrashSelectionbar({
  dialogs,
  tagEditor,
}: UseTrashSelectionbarProps) {
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
          onClick: restoreDialog.openSelected,
        },
        {
          key: "delete",
          type: "action",
          variant: "destructive",
          icon: Trash2Icon,
          label: "削除",
          onClick: deleteDialog.openSelected,
        },
      ] satisfies MenuItemDef<MultipleNodesContext>[],
    [restoreDialog.openSelected, deleteDialog.openSelected]
  );

  return {
    menu: {
      items: menuItems,
      inlineItems: inlineMenuItems,
    },
  };
}
