import { useExtractDialog } from "@/feature/archive/hooks/use-extract-dialog";
import { useFavoriteDialog } from "@/feature/favorite/hooks/use-favorite-dialog";
import { useRatingFilterDialog } from "@/feature/filter/hooks/use-rating-filter-dialog";
import { useTagFilterDialog } from "@/feature/filter/hooks/use-tag-filter-dialog";
import { useCreateFolderDialog } from "@/feature/folder/hooks/use-create-folder-dialog";
import { useCopyDialog } from "@/feature/node/hooks/use-copy-dialog";
import { useDeleteDialog } from "@/feature/node/hooks/use-delete-dialog";
import { useMoveDialog } from "@/feature/node/hooks/use-move-dialog";
import { useRenameDialog } from "@/feature/node/hooks/use-rename-dialog";
import { ExplorerFavorites } from "@/feature/pages/explorer/hooks/use-explorer-favorites";
import { ExplorerFiltering } from "@/feature/pages/explorer/hooks/use-explorer-filtering";
import { usePreviewDialog } from "@/feature/preview/hooks/use-preview-dialog";
import { MediaNodeSelection } from "@/feature/selection/hooks/use-media-node-selection";
import { useTextFilePreviewDialog } from "@/feature/text-file-reader/hooks/use-text-file-preview-dialog";
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
