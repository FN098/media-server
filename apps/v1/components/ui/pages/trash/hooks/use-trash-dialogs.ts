import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useRestoreDialog } from "@/hooks/use-restore-dialog";
import { MediaNode } from "@/lib/media/types";

export type TrashDialogs = ReturnType<typeof useTrashDialogs>;

type UseTrashDialogsProps = {
  selectedNodes: MediaNode[];
  clearSelection: () => void;
  onSelectionChange: (nodes: MediaNode[]) => void;
};

export function useTrashDialogs({
  selectedNodes,
  clearSelection,
  onSelectionChange,
}: UseTrashDialogsProps) {
  const deleteDialog = useDeleteDialog({
    onSelectionChange,
  });

  const restoreDialog = useRestoreDialog({
    selectedNodes,
    clearSelection,
  });

  const all = {
    deleteDialog,
    restoreDialog,
  } as const;

  const isOpen = Object.values(all).some(({ isOpen }) => isOpen);

  return {
    ...all,
    isOpen,
  };
}
