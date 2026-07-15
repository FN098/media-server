import { ExtractDialog } from "@/feature/archive/ui/extract-dialog";
import { FavoriteManyDialog } from "@/feature/favorite/ui/favorite-many-dialog";
import { CreateFolderDialog } from "@/feature/folder/ui/create-folder-dialog";
import { CopyDialog } from "@/feature/node/ui/copy-dialog";
import { DeleteDialog } from "@/feature/node/ui/delete-dialog";
import { MoveDialog } from "@/feature/node/ui/move-dialog";
import { RenameDialog } from "@/feature/node/ui/rename-dialog";
import { useExplorerContext } from "@/feature/pages/explorer/providers/explorer-provider";
import { PreviewDialog } from "@/feature/preview/ui/preview-dialog";
import { TextFilePreviewDialog } from "@/feature/text-file-reader/ui/text-file-preview-dialog";

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
      <FavoriteManyDialog dialog={dialogs.favoriteDialog} />
      <TextFilePreviewDialog dialog={dialogs.textFilePreviewDialog} />
    </>
  );
}
