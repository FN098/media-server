import { ApplyPreviewDialog } from "@/components/ui/dialogs/apply-preview-dialog";
import { CopyDialog } from "@/components/ui/dialogs/copy-dialog";
import { CreateFolderDialog } from "@/components/ui/dialogs/create-folder-dialog";
import { DeleteDialog } from "@/components/ui/dialogs/delete-dialog";
import { ExtractDialog } from "@/components/ui/dialogs/extract-dialog";
import { FavoriteDialog } from "@/components/ui/dialogs/favorite-dialog";
import { MoveDialog } from "@/components/ui/dialogs/move-dialog";
import { RatingFilterDialog } from "@/components/ui/dialogs/rating-filter-dialog";
import { RenameDialog } from "@/components/ui/dialogs/rename-dialog";
import { TagFilterDialog } from "@/components/ui/dialogs/tag-filter-dialog";
import { ExplorerDialogs as ExplorerDialogsType } from "@/components/ui/pages/explorer/hooks/use-explorer-dialogs";
import { ExplorerFiltering } from "@/components/ui/pages/explorer/hooks/use-explorer-filtering";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";

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
      <ExtractDialog dialog={extractDialog} />

      {/* リネームダイアログ */}
      <RenameDialog dialog={renameDialog} />

      {/* フォルダ作成ダイアログ */}
      <CreateFolderDialog dialog={createFolderDialog} />

      {/* 移動ダイアログ */}
      <MoveDialog dialog={moveDialog} />

      {/* コピーダイアログ */}
      <CopyDialog dialog={copyDialog} />

      {/* 削除ダイアログ */}
      <DeleteDialog dialog={deleteDialog} />

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

interface ExplorerToolbarDialogsProps {
  dialogs: ExplorerDialogsType;
  filtering: ExplorerFiltering;
}

export function ExplorerToolbarDialogs({
  dialogs,
  filtering,
}: ExplorerToolbarDialogsProps) {
  const isMobile = useIsMobile();

  return (
    <>
      {/* 評価フィルターダイアログ */}
      <RatingFilterDialog
        open={dialogs.ratingFilterDialog.isOpen}
        onOpenChange={(open) => !open && dialogs.ratingFilterDialog.close()}
        value={dialogs.ratingFilterDialog.currentValue}
        onChange={filtering.controls.rating.apply}
      />

      {/* タグフィルター */}
      <TagFilterDialog
        open={dialogs.tagFilterDialog.isOpen}
        onOpenChange={(open) => !open && dialogs.tagFilterDialog.close()}
        value={filtering.controls.tag.value}
        onChange={filtering.controls.tag.apply}
        relatedNodes={filtering.mediaOnly}
        autoFocusInput={!isMobile}
      />
    </>
  );
}
