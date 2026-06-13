import { useCopyDialog } from "@/hooks/dialogs/use-copy-dialog";
import { useCreateFolderDialog } from "@/hooks/dialogs/use-create-folder-dialog";
import { useDeleteDialog } from "@/hooks/dialogs/use-delete-dialog";
import { useExtractDialog } from "@/hooks/dialogs/use-extract-dialog";
import { useFavoriteDialog } from "@/hooks/dialogs/use-favorite-dialog";
import { useMoveDialog } from "@/hooks/dialogs/use-move-dialog";
import { usePreviewDialog } from "@/hooks/dialogs/use-preview-dialog";
import { useRatingFilterDialog } from "@/hooks/dialogs/use-rating-filter-dialog";
import { useRenameDialog } from "@/hooks/dialogs/use-rename-dialog";
import { useTagFilterDialog } from "@/hooks/dialogs/use-tag-filter-dialog";
import { useTextFilePreviewDialog } from "@/hooks/dialogs/use-text-file-preview-dialog";
import { ExplorerFavorites } from "@/hooks/pages/explorer/use-explorer-favorites";
import { ExplorerFiltering } from "@/hooks/pages/explorer/use-explorer-filtering";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { useMemo } from "react";

interface UseExplorerDialogsProps {
  filtering: ExplorerFiltering;
  selection: MediaNodeSelection;
  favorites: ExplorerFavorites;
}

export function useExplorerDialogs({
  filtering,
  selection,
  favorites,
}: UseExplorerDialogsProps) {
  const renameDialog = useRenameDialog({
    onSuccess: ({ nextPath, prevPath }) =>
      void favorites.refreshPath(prevPath, nextPath),
  });
  const moveDialog = useMoveDialog();
  const copyDialog = useCopyDialog();
  const createFolderDialog = useCreateFolderDialog();
  const deleteDialog = useDeleteDialog({
    onSuccess: selection.reset,
  });
  const extractDialog = useExtractDialog();
  const previewDialog = usePreviewDialog();
  const favoriteDialog = useFavoriteDialog();
  const textFilePreviewDialog = useTextFilePreviewDialog();

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
        textFilePreviewDialog,
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
      textFilePreviewDialog,
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

export type ExplorerDialogs = ReturnType<typeof useExplorerDialogs>;
