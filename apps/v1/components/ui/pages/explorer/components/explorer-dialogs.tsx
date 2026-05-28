import { ApplyPreviewDialog } from "@/components/ui/dialogs/apply-preview-dialog";
import { CopyDialog } from "@/components/ui/dialogs/copy-dialog";
import { CreateFolderDialog } from "@/components/ui/dialogs/create-folder-dialog";
import { DeleteDialog } from "@/components/ui/dialogs/delete-dialog";
import { ExtractDialog } from "@/components/ui/dialogs/extract-dialog";
import { FavoriteDialog } from "@/components/ui/dialogs/favorite-dialog";
import { MoveDialog } from "@/components/ui/dialogs/move-dialog";
import { RenameDialog } from "@/components/ui/dialogs/rename-dialog";
import { ExplorerDialogs as ExplorerDialogsType } from "@/components/ui/pages/explorer/hooks/use-explorer-dialogs";

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
        onOpenChange={(open) => {
          if (!open) {
            extractDialog.close();
          }
        }}
        targets={extractDialog.targets}
      />

      {/* リネームダイアログ */}
      <RenameDialog
        open={renameDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            renameDialog.close();
          }
        }}
        sourcePath={renameDialog.target?.path ?? ""}
        currentName={renameDialog.target?.name ?? ""}
        isDirectory={renameDialog.target?.isDirectory}
      />

      {/* フォルダ作成ダイアログ */}
      <CreateFolderDialog
        key={`create-folder-${createFolderDialog.isOpen}`}
        open={createFolderDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            createFolderDialog.close();
          }
        }}
        parentPath={createFolderDialog.parentPath}
      />

      {/* 移動ダイアログ */}
      <MoveDialog
        open={moveDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            moveDialog.close();
          }
        }}
        sourceNodes={moveDialog.targets}
      />

      {/* コピーダイアログ */}
      <CopyDialog
        open={copyDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            copyDialog.close();
          }
        }}
        sourceNodes={copyDialog.targets}
      />

      {/* 削除ダイアログ */}
      <DeleteDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            deleteDialog.close();
          }
        }}
        targets={deleteDialog.targets}
      />

      {/* プレビュー設定ダイアログ */}
      <ApplyPreviewDialog
        open={previewDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            previewDialog.close();
          }
        }}
        previewPath={previewDialog.previewPath}
      />

      {/* お気に入りダイアログ */}
      <FavoriteDialog
        open={favoriteDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            favoriteDialog.close();
          }
        }}
        targets={favoriteDialog.targets}
        mode={favoriteDialog.mode}
      />
    </>
  );
}
