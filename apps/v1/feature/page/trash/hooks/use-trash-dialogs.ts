import { useRatingFilterDialog } from "@/feature/filter/hooks/use-rating-filter-dialog";
import { useTagFilterDialog } from "@/feature/filter/hooks/use-tag-filter-dialog";
import { useDeleteDialog } from "@/feature/node/hooks/use-delete-dialog";
import { useRestoreDialog } from "@/feature/node/hooks/use-restore-dialog";
import { TrashFiltering } from "@/feature/page/trash/hooks/use-trash-filtering";
import { MediaNodeSelection } from "@/feature/selection/hooks/use-media-node-selection";
import { useMemo } from "react";

interface UseTrashDialogsProps {
  filtering: TrashFiltering;
  selection: MediaNodeSelection;
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
