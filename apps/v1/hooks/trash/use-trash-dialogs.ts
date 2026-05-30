import { useDeleteDialog } from "@/hooks/dialogs/use-delete-dialog";
import { useRestoreDialog } from "@/hooks/dialogs/use-restore-dialog";
import { useTagFilterDialog } from "@/hooks/dialogs/use-tag-filter-dialog";
import { TrashFiltering } from "@/hooks/trash/use-trash-filtering";
import { useMemo } from "react";

export type TrashDialogs = ReturnType<typeof useTrashDialogs>;

interface UseTrashDialogsProps {
  filtering: TrashFiltering;
}

export function useTrashDialogs({ filtering }: UseTrashDialogsProps) {
  const deleteDialog = useDeleteDialog();
  const restoreDialog = useRestoreDialog();

  const tagFilterDialog = useTagFilterDialog({
    onApply: filtering.controls.tag.apply,
    autoFocusInput: true,
  });

  const all = useMemo(
    () =>
      ({
        deleteDialog,
        restoreDialog,
        tagFilterDialog,
      }) as const,
    [deleteDialog, restoreDialog, tagFilterDialog]
  );

  const isOpen = useMemo(
    () => Object.values(all).some(({ isOpen }) => isOpen),
    [all]
  );

  return {
    ...all,
    isOpen,
  };
}
