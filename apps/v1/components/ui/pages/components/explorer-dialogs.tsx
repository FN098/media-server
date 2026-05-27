import { ApplyPreviewDialog } from "@/components/ui/dialogs/apply-preview-dialog";
import { CopyDialog } from "@/components/ui/dialogs/copy-dialog";
import { CreateFolderDialog } from "@/components/ui/dialogs/create-folder-dialog";
import { DeleteDialog } from "@/components/ui/dialogs/delete-dialog";
import { ExtractDialog } from "@/components/ui/dialogs/extract-dialog";
import { FavoriteDialog } from "@/components/ui/dialogs/favorite-dialog";
import { MoveDialog } from "@/components/ui/dialogs/move-dialog";
import { RenameDialog } from "@/components/ui/dialogs/rename-dialog";
import { ExplorerDialogs as ExplorerDialogsType } from "@/components/ui/pages/hooks/use-explorer-dialogs";

type ExplorerDialogsProps = {
  dialogs: ExplorerDialogsType;
};

export function ExplorerDialogs({ dialogs }: ExplorerDialogsProps) {
  const {
    copyDialog,
    createFolderDialog,
    deleteDialog,
    extractDialog,
    favoriteDialog,
    moveDialog,
    previewDialog,
    renameDialog,
  } = dialogs;

  return (
    <>
      {/* 解凍ダイアログ */}
      <ExtractDialog
        open={extractDialog.isOpen}
        onOpenChange={extractDialog.onOpenChange}
        targets={extractDialog.targets}
      />

      {/* リネームダイアログ */}
      <RenameDialog
        open={renameDialog.isOpen}
        onOpenChange={renameDialog.onOpenChange}
        sourcePath={renameDialog.target?.path ?? ""}
        currentName={renameDialog.target?.name ?? ""}
        isDirectory={renameDialog.target?.isDirectory}
      />

      {/* フォルダ作成ダイアログ */}
      <CreateFolderDialog
        key={`create-folder-${createFolderDialog.isOpen}`}
        open={createFolderDialog.isOpen}
        onOpenChange={createFolderDialog.onOpenChange}
        parentPath={createFolderDialog.parentDirPath}
      />

      {/* 移動ダイアログ */}
      <MoveDialog
        open={moveDialog.isOpen}
        onOpenChange={moveDialog.onOpenChange}
        sourceNodes={moveDialog.targets}
        initialDirPath={moveDialog.initialDir}
      />

      {/* コピーダイアログ */}
      <CopyDialog
        open={copyDialog.isOpen}
        onOpenChange={copyDialog.onOpenChange}
        sourceNodes={copyDialog.targets}
        initialDirPath={copyDialog.initialDir}
      />

      {/* 削除ダイアログ */}
      <DeleteDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.onOpenChange}
        targets={deleteDialog.targets}
      />

      {/* プレビュー設定ダイアログ */}
      <ApplyPreviewDialog
        open={previewDialog.isOpen}
        onOpenChange={previewDialog.onOpenChange}
        previewPath={previewDialog.previewPath}
      />

      {/* お気に入りダイアログ */}
      <FavoriteDialog
        open={favoriteDialog.isOpen}
        onOpenChange={favoriteDialog.onOpenChange}
        targets={favoriteDialog.targets}
        mode={favoriteDialog.mode}
      />
    </>
  );
}
