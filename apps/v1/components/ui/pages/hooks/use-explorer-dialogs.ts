import { useCopyDialog } from "@/hooks/use-copy-dialog";
import { useCreateFolderDialog } from "@/hooks/use-create-folder-dialog";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useExtractDialog } from "@/hooks/use-extract-dialog";
import { useFavoriteDialog } from "@/hooks/use-favorites-dialog";
import { useMoveDialog } from "@/hooks/use-move-dialog";
import { usePreviewDialog } from "@/hooks/use-preview-dialog";
import { useRenameDialog } from "@/hooks/use-rename-dialog";
import { MediaNode } from "@/lib/media/types";

type UseExplorerDialogsProps = {
  currentDir: string;
  selectedNodes: MediaNode[];
  clearSelection: () => void;
};

export function useExplorerDialogs({
  currentDir,
  selectedNodes,
  clearSelection,
}: UseExplorerDialogsProps) {
  const renameDialog = useRenameDialog<MediaNode>();

  const moveDialog = useMoveDialog({
    initialDir: currentDir,
    selectedNodes,
    clearSelection,
  });

  const copyDialog = useCopyDialog({
    initialDir: currentDir,
    selectedNodes,
    clearSelection,
  });

  const createFolderDialog = useCreateFolderDialog({
    targetDirPath: currentDir,
  });

  const deleteDialog = useDeleteDialog({
    selectedNodes,
    clearSelection,
  });

  const extractDialog = useExtractDialog({
    selectedNodes,
    clearSelection,
  });

  const previewDialog = usePreviewDialog();

  const favoriteDialog = useFavoriteDialog({
    selectedNodes,
  });

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

  const isDialogOpen = Object.values(all).some(({ isOpen }) => isOpen);

  return {
    ...all,
    isDialogOpen,
  };
}
