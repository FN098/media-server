import { CopyDialog } from "@/components/ui/dialogs/copy-dialog";
import { CreateFolderDialog } from "@/components/ui/dialogs/create-folder-dialog";
import { DeleteDialog } from "@/components/ui/dialogs/delete-dialog";
import { ExtractDialog } from "@/components/ui/dialogs/extract-dialog";
import { FavoriteDialog } from "@/components/ui/dialogs/favorite-dialog";
import { MoveDialog } from "@/components/ui/dialogs/move-dialog";
import { PreviewDialog } from "@/components/ui/dialogs/preview-dialog";
import { RenameDialog } from "@/components/ui/dialogs/rename-dialog";
import { TextFilePreviewDialog } from "@/components/ui/dialogs/text-file-preview-dialog";
import { useExplorerContext } from "@/providers/pages/explorer-provider";

export function ExplorerDialogs() {
  const { dialogs } = useExplorerContext();

  return (
    <>
      <ExtractDialog dialog={dialogs.extractDialog} />
      <RenameDialog dialog={dialogs.renameDialog} />
      <CreateFolderDialog dialog={dialogs.createFolderDialog} />
      <MoveDialog dialog={dialogs.moveDialog} />
      <CopyDialog dialog={dialogs.copyDialog} />
      <DeleteDialog dialog={dialogs.deleteDialog} />
      <PreviewDialog dialog={dialogs.previewDialog} />
      <FavoriteDialog dialog={dialogs.favoriteDialog} />
      <TextFilePreviewDialog dialog={dialogs.textFilePreviewDialog} />
    </>
  );
}
