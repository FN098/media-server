import { TagEditor } from "@/app/(pages)/(tag-editor)/_hooks/use-tag-editor";
import { TrashDialogs } from "@/feature/pages/trash/hooks/use-trash-dialogs";
import { NodeSelectionControl } from "@/feature/selection/hooks/use-node-selection-control";
import { ManyNodesContext, MenuItemDef } from "@/lib/menu-items/types";
import { RotateCcwIcon, TagIcon, Trash2Icon } from "lucide-react";
import { useMemo } from "react";

interface TrashSelectionBarMenuContext {
  selectedNodes: NodeSelectionControl["selectedNodes"];
  hasSelection: boolean;
  tagEditor: TagEditor;
  restoreDialog: TrashDialogs["restoreDialog"];
  deleteDialog: TrashDialogs["deleteDialog"];
}

function createTrashSelectionBarMenu({
  selectedNodes,
  hasSelection,
  tagEditor,
  restoreDialog,
  deleteDialog,
}: TrashSelectionBarMenuContext) {
  const inlineItems: MenuItemDef<ManyNodesContext>[] = [
    {
      key: "editTags",
      type: "action",
      icon: TagIcon,
      label: "タグ編集",
      onClick: tagEditor.open,
    },
  ];

  const items = [
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
      onClick: () => deleteDialog.open(selectedNodes, { isPermanent: true }),
      disabled: () => !hasSelection,
    },
  ] satisfies MenuItemDef<ManyNodesContext>[];

  return {
    items,
    inlineItems,
  };
}

interface UseTrashSelectionBarProps {
  selection: NodeSelectionControl;
  dialogs: TrashDialogs;
  tagEditor: TagEditor;
}

export function useTrashSelectionBar({
  selection,
  dialogs,
  tagEditor,
}: UseTrashSelectionBarProps) {
  const { hasSelection, selectedNodes } = selection;
  const { restoreDialog, deleteDialog } = dialogs;

  const menu = useMemo(
    () =>
      createTrashSelectionBarMenu({
        selectedNodes,
        hasSelection,
        tagEditor,
        restoreDialog,
        deleteDialog,
      }),
    [deleteDialog, hasSelection, restoreDialog, selectedNodes, tagEditor]
  );

  return {
    menu,
  };
}
