import { useDeleteDialog } from "@/hooks/dialogs/use-delete-dialog";
import { useRatingFilterDialog } from "@/hooks/dialogs/use-rating-filter-dialog";
import { useRestoreDialog } from "@/hooks/dialogs/use-restore-dialog";
import { useTagFilterDialog } from "@/hooks/dialogs/use-tag-filter-dialog";
import { TrashFiltering } from "@/hooks/trash/use-trash-filtering";
import { useMemo } from "react";

interface UseTrashDialogsProps {
  filtering: TrashFiltering;
}

export function useTrashDialogs({ filtering }: UseTrashDialogsProps) {
  const deleteDialog = useDeleteDialog();
  const restoreDialog = useRestoreDialog();

  const ratingFilterDialog = useRatingFilterDialog({
    onApply: filtering.controls.rating.apply,
  });

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
        ratingFilterDialog,
      }) as const,
    [deleteDialog, ratingFilterDialog, restoreDialog, tagFilterDialog]
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

export type TrashDialogs = ReturnType<typeof useTrashDialogs>;
