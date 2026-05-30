import { ExplorerFiltering } from "@/components/ui/pages/explorer/hooks/use-explorer-filtering";
import { useCopyDialog } from "@/hooks/use-copy-dialog";
import { useCreateFolderDialog } from "@/hooks/use-create-folder-dialog";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useExtractDialog } from "@/hooks/use-extract-dialog";
import { useFavoriteDialog } from "@/hooks/use-favorite-dialog";
import { useMoveDialog } from "@/hooks/use-move-dialog";
import { usePreviewDialog } from "@/hooks/use-preview-dialog";
import { useRatingFilterDialog } from "@/hooks/use-rating-filter-dialog";
import { useRenameDialog } from "@/hooks/use-rename-dialog";
import { useTagFilterDialog } from "@/hooks/use-tag-filter-dialog";
import { useMemo } from "react";

export type ExplorerDialogs = ReturnType<typeof useExplorerDialogs>;

interface UseExplorerDialogsProps {
  filtering: ExplorerFiltering;
}

export function useExplorerDialogs({ filtering }: UseExplorerDialogsProps) {
  const renameDialog = useRenameDialog();
  const moveDialog = useMoveDialog();
  const copyDialog = useCopyDialog();
  const createFolderDialog = useCreateFolderDialog();
  const deleteDialog = useDeleteDialog();
  const extractDialog = useExtractDialog();
  const previewDialog = usePreviewDialog();
  const favoriteDialog = useFavoriteDialog();
  const ratingFilterDialog = useRatingFilterDialog({
    onApply: filtering.controls.rating.apply,
  });
  const tagFilterDialog = useTagFilterDialog({
    onApply: filtering.controls.tag.apply,
    autoFocusInput: true,
  });

  const allDialogs = useMemo(
    () =>
      ({
        renameDialog,
        moveDialog,
        copyDialog,
        createFolderDialog,
        deleteDialog,
        extractDialog,
        previewDialog,
        favoriteDialog,
        ratingFilterDialog,
        tagFilterDialog,
      }) as const,
    [
      copyDialog,
      createFolderDialog,
      deleteDialog,
      extractDialog,
      favoriteDialog,
      moveDialog,
      previewDialog,
      ratingFilterDialog,
      renameDialog,
      tagFilterDialog,
    ]
  );

  const isOpen = useMemo(
    () => Object.values(allDialogs).some(({ isOpen }) => isOpen),
    [allDialogs]
  );

  return {
    ...allDialogs,
    isOpen,
  };
}
