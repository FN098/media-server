import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useRestoreDialog } from "@/hooks/use-restore-dialog";
import { MediaNode } from "@/lib/media/types";

export type TrashDialogs = ReturnType<typeof useTrashDialogs>;

type UseTrashDialogsProps = {
  selectedNodes: MediaNode[];
  clearSelection: () => void;
};

export function useTrashDialogs({
  selectedNodes,
  clearSelection,
}: UseTrashDialogsProps) {
  const deleteDialog = useDeleteDialog({
    selectedNodes,
    clearSelection,
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
