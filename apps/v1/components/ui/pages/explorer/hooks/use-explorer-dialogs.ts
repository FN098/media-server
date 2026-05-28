import { useCopyDialog } from "@/hooks/use-copy-dialog";
import { useCreateFolderDialog } from "@/hooks/use-create-folder-dialog";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useExtractDialog } from "@/hooks/use-extract-dialog";
import { useFavoriteDialog } from "@/hooks/use-favorites-dialog";
import { useMoveDialog } from "@/hooks/use-move-dialog";
import { usePreviewDialog } from "@/hooks/use-preview-dialog";
import { useRenameDialog } from "@/hooks/use-rename-dialog";
import { MediaNode } from "@/lib/media/types";

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

  const all = {
    renameDialog,
    moveDialog,
    copyDialog,
    createFolderDialog,
    deleteDialog,
    extractDialog,
    previewDialog,
    favoriteDialog,
  } as const;

  const isOpen = Object.values(all).some(({ isOpen }) => isOpen);

  return {
    ...all,
    isOpen,
  };
}
