import { useExtractDialog } from "@/__feature/archive/hooks/use-extract-dialog";
import { useFavoriteDialog } from "@/__feature/favorite/hooks/use-favorite-dialog";
import { useTagFilterDialog } from "@/__feature/filter/hooks/use-tag-filter-dialog";
import { useCopyDialog } from "@/__feature/node/hooks/use-copy-dialog";
import { useDeleteDialog } from "@/__feature/node/hooks/use-delete-dialog";
import { useRenameDialog } from "@/__feature/node/hooks/use-rename-dialog";
import { usePreviewDialog } from "@/__feature/preview/hooks/use-preview-dialog";
import { useTextFilePreviewDialog } from "@/__feature/text-file-reader/hooks/use-text-file-preview-dialog";
import { useExplorerFavorites } from "@/app/(pages)/explorer/_hooks/use-explorer-favorites";
import { useExplorerFiltering } from "@/app/(pages)/explorer/_hooks/use-explorer-filtering";
import { useExplorerSelection } from "@/app/(pages)/explorer/_hooks/use-explorer-selection";
import { useCreateFolderDialog } from "@/feature/create-folder/hooks/use-create-folder-dialog";
import { useMoveDialog } from "@/feature/move-node/hooks/use-move-dialog";
import { useMemo } from "react";

export function useExplorerDialogs() {
  const {
    controls: {
      tag: { apply: applyTagFilter },
    },
  } = useExplorerFiltering();
  const { reset: resetSelection } = useExplorerSelection();
  const { refresh: refreshFavorite } = useExplorerFavorites();

  // Dialogs
  const renameDialog = useRenameDialog({
    onSuccess: ({ id, isDirectory }) => void refreshFavorite(id, isDirectory),
  });
  const moveDialog = useMoveDialog();
  const copyDialog = useCopyDialog();
  const createFolderDialog = useCreateFolderDialog();
  const deleteDialog = useDeleteDialog({
    onSuccess: resetSelection,
  });
  const extractDialog = useExtractDialog();
  const previewDialog = usePreviewDialog();
  const favoriteDialog = useFavoriteDialog();
  const textFilePreviewDialog = useTextFilePreviewDialog();
  const tagFilterDialog = useTagFilterDialog({
    onApply: applyTagFilter,
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
