import { ExtractDialog } from "@/__feature/archive/ui/extract-dialog";
import { FavoriteManyDialog } from "@/__feature/favorite/ui/favorite-many-dialog";
import { CreateFolderDialog } from "@/__feature/folder/ui/create-folder-dialog";
import { CopyDialog } from "@/__feature/node/ui/copy-dialog";
import { DeleteDialog } from "@/__feature/node/ui/delete-dialog";
import { MoveDialog } from "@/__feature/node/ui/move-dialog";
import { RenameDialog } from "@/__feature/node/ui/rename-dialog";
import { PreviewDialog } from "@/__feature/preview/ui/preview-dialog";
import { TextFilePreviewDialog } from "@/__feature/text-file-reader/ui/text-file-preview-dialog";
import { useExplorerContext } from "@/app/(pages)/explorer/_providers/explorer-provider";

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
