import { useTagFilterDialog } from "@/__feature/filter/hooks/use-tag-filter-dialog";
import { useDeleteDialog } from "@/__feature/node/hooks/use-delete-dialog";
import { useRestoreDialog } from "@/__feature/node/hooks/use-restore-dialog";
import { TrashFiltering } from "@/__feature/pages/trash/hooks/use-trash-filtering";
import { useRatingFilterDialog } from "@/feature/filter/hooks/use-rating-filter-dialog";
import { NodeSelection } from "@/feature/selection/hooks/use-node-selection";
import { useMemo } from "react";

interface UseTrashDialogsProps {
  filtering: TrashFiltering;
  selection: NodeSelection;
}

export function useTrashDialogs({
  filtering,
  selection,
}: UseTrashDialogsProps) {
  const deleteDialog = useDeleteDialog({
    onSuccess: selection.reset,
  });

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
