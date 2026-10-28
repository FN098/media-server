import { ExtractDialog } from "@/__feature/archive/ui/extract-dialog";
import { FavoriteManyDialog } from "@/__feature/favorite/ui/favorite-many-dialog";
import { CreateFolderDialog } from "@/__feature/folder/ui/create-folder-dialog";
import { CopyDialog } from "@/__feature/node/ui/copy-dialog";
import { DeleteDialog } from "@/__feature/node/ui/delete-dialog";
import { MoveDialog } from "@/__feature/node/ui/move-dialog";
import { RenameDialog } from "@/__feature/node/ui/rename-dialog";
import { PreviewDialog } from "@/__feature/preview/ui/preview-dialog";
import { TextFilePreviewDialog } from "@/__feature/text-file-reader/ui/text-file-preview-dialog";
import { useExplorerDialogs } from "@/app/(pages)/explorer/_hooks/use-explorer-dialogs";

export function ExplorerDialogs() {
  const {
    extractDialog,
    renameDialog,
    createFolderDialog,
    moveDialog,
    copyDialog,
    deleteDialog,
    previewDialog,
    favoriteDialog,
    textFilePreviewDialog,
  } = useExplorerDialogs();

  return (
    <>
      <ExtractDialog
        open={extractDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) extractDialog.close();
        }}
        isPending={extractDialog.isPending}
        items={extractDialog.targets}
        onConfirm={extractDialog.performExtract}
      />

      <RenameDialog
        open={renameDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) renameDialog.close();
        }}
        newName={renameDialog.newName}
        setNewName={renameDialog.setNewName}
        extension={renameDialog.extension}
        inputRef={renameDialog.inputRef}
        isPending={renameDialog.isPending}
        onConfirm={renameDialog.performRename}
      />

      <CreateFolderDialog dialog={createFolderDialog} />
      <MoveDialog dialog={moveDialog} />
      <CopyDialog dialog={copyDialog} />
      <DeleteDialog dialog={deleteDialog} />
      <PreviewDialog dialog={previewDialog} />
      <FavoriteManyDialog dialog={favoriteDialog} />
      <TextFilePreviewDialog dialog={textFilePreviewDialog} />
    </>
  );
}
