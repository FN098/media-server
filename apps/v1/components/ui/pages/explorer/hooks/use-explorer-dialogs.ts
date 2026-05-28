import { useCopyDialog } from "@/hooks/use-copy-dialog";
import { useCreateFolderDialog } from "@/hooks/use-create-folder-dialog";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useExtractDialog } from "@/hooks/use-extract-dialog";
import { useFavoriteDialog } from "@/hooks/use-favorites-dialog";
import { useMoveDialog } from "@/hooks/use-move-dialog";
import { usePreviewDialog } from "@/hooks/use-preview-dialog";
import { useRatingFilterDialog } from "@/hooks/use-rating-filter-dialog";
import { useRenameDialog } from "@/hooks/use-rename-dialog";
import { MediaNode } from "@/lib/media/types";
import { useMemo } from "react";

export type ExplorerDialogs = ReturnType<typeof useExplorerDialogs>;

export function useExplorerDialogs() {
  const renameDialog = useRenameDialog<MediaNode>();
  const moveDialog = useMoveDialog<MediaNode>();
  const copyDialog = useCopyDialog<MediaNode>();
  const createFolderDialog = useCreateFolderDialog();
  const deleteDialog = useDeleteDialog<MediaNode>();
  const extractDialog = useExtractDialog<MediaNode>();
  const previewDialog = usePreviewDialog();
  const favoriteDialog = useFavoriteDialog<MediaNode>();
  const ratingFilterDialog = useRatingFilterDialog();

  const all = useMemo(
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
    ]
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
