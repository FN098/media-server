import { ExtractDialog } from "@/__feature/archive/ui/extract-dialog";
import { RenameDialog } from "@/__feature/node/ui/rename-dialog";
import { useExplorerDialogs } from "@/app/(pages)/explorer/_hooks/use-explorer-dialogs";
import { CreateFolderDialog } from "@/feature/create-folder/ui/create-folder-dialog";

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

      <CreateFolderDialog
        open={createFolderDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) createFolderDialog.close();
        }}
        newFolderName={createFolderDialog.newFolderName}
        setNewFolderName={createFolderDialog.setNewFolderName}
        isPending={createFolderDialog.isPending}
        onConfirm={createFolderDialog.performCreate}
      />

      {/* <MoveDialog
        open={moveDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) moveDialog.close();
        }}
        currentFolder={moveDialog.currentDir}
        setNewFolderName={moveDialog.setNewFolderName}
        isPending={moveDialog.isPending}
        onConfirm={moveDialog.performCreate}

        // currentFolder,
        // folders,
        // recentFolders,
        // isLoading,
        // isPending,
        // onOpenFolder,
        // onOpenParentFolder,
        // onTogglePin,
        // onConfirm,
      /> */}

      {/* <CopyDialog dialog={copyDialog} />
      <DeleteDialog dialog={deleteDialog} />
      <PreviewDialog dialog={previewDialog} />
      <FavoriteManyDialog dialog={favoriteDialog} />
      <TextFilePreviewDialog dialog={textFilePreviewDialog} /> */}
    </>
  );
}
