import { ExplorerSelection } from "@/components/ui/pages/explorer/hooks/use-explorer-selection";
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

interface UseExplorerDialogsProps {
  selection: ExplorerSelection;
}

export function useExplorerDialogs({ selection }: UseExplorerDialogsProps) {
  const renameDialog = useRenameDialog<MediaNode>({
    onChange: (ctx) =>
      ctx.isOpen ? selection.replace(ctx.target) : selection.reset(),
  });

  const moveDialog = useMoveDialog<MediaNode>({
    onChange: (ctx) =>
      ctx.isOpen ? selection.select(ctx.targets) : selection.reset(),
  });

  const copyDialog = useCopyDialog<MediaNode>({
    onChange: (ctx) =>
      ctx.isOpen ? selection.select(ctx.targets) : selection.reset(),
  });

  const createFolderDialog = useCreateFolderDialog({});

  const deleteDialog = useDeleteDialog<MediaNode>({
    onChange: (ctx) =>
      ctx.isOpen ? selection.select(ctx.targets) : selection.reset(),
  });

  const extractDialog = useExtractDialog<MediaNode>({
    onChange: (ctx) =>
      ctx.isOpen ? selection.select(ctx.targets) : selection.reset(),
  });

  const previewDialog = usePreviewDialog({});

  const favoriteDialog = useFavoriteDialog<MediaNode>({
    onChange: (ctx) =>
      ctx.isOpen ? selection.select(ctx.targets) : selection.reset(),
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

  const isOpen = Object.values(all).some(({ isOpen }) => isOpen);

  return {
    ...all,
    isOpen,
  };
}
