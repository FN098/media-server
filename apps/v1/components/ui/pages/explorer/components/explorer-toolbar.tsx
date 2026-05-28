import { RatingFilterDialog } from "@/components/ui/dialogs/rating-filter-dialog";
import { TagFilterDialog } from "@/components/ui/dialogs/tag-filter-dialog";
import { FilterDropdownMenu } from "@/components/ui/dropdown-menus/filter-dropwodn-menu";
import { SortDropdownMenu } from "@/components/ui/dropdown-menus/sort-dropdown-menu";
import { ExplorerDialogs } from "@/components/ui/pages/explorer/hooks/use-explorer-dialogs";
import { ExplorerFavorites } from "@/components/ui/pages/explorer/hooks/use-explorer-favorites";
import { useExplorerFilterMenu } from "@/components/ui/pages/explorer/hooks/use-explorer-filter-menu";
import { ExplorerFiltering } from "@/components/ui/pages/explorer/hooks/use-explorer-filtering";
import { ExplorerSort } from "@/components/ui/pages/explorer/hooks/use-explorer-sort";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { MediaListing } from "@/lib/media/types";
import { Button } from "@/shadcn/components/ui/button";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { FolderPlus, TrashIcon } from "lucide-react";

interface ExplorerToolbarProps {
  listing: MediaListing;
  sort: ExplorerSort;
  filtering: ExplorerFiltering;
  dialogs: ExplorerDialogs;
  favorites: ExplorerFavorites;
}

export function ExplorerToolbar({
  listing,
  sort,
  filtering,
  dialogs,
  favorites,
}: ExplorerToolbarProps) {
  const isMobile = useIsMobile();
  const filter = useExplorerFilterMenu({ filtering, dialogs });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2 flex-grow">
        {/* ソート */}
        <SortDropdownMenu
          value={sort.value}
          onChange={sort.apply}
          options={sort.options}
        />

        {/* フィルター */}
        <FilterDropdownMenu
          items={filter.menuItems}
          onReset={filtering.reset}
          canReset={filtering.canReset}
        />

        {/* TODO: ExplorerToolbarDialogs にまとめる */}
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

        {/* TODO: アクションメニューにまとめる */}
        <>
          {/* 新規フォルダ */}
          <Button
            variant="outline"
            onClick={() => dialogs.createFolderDialog.open(listing.path)}
          >
            <FolderPlus className="h-4 w-4" />
            新規フォルダ
          </Button>

          {/* お気に入り以外一括削除 */}
          <Button
            variant="outline"
            onClick={() => {
              // ファイルかつお気に入りでないものを抽出
              const targets = filtering.filteredNodes.filter(
                (node) =>
                  !node.isDirectory && !favorites.get(node.path).isFavorite
              );
              if (targets.length > 0) {
                dialogs.deleteDialog.open(targets);
              }
            }}
          >
            <TrashIcon className="h-4 w-4" />
            お気に入り以外一括削除
          </Button>
        </>
      </div>

      {/* 件数 */}
      <FilterResultText
        totalCount={filtering.totalCount}
        filteredCount={filtering.filteredCount}
        isFiltered={filtering.isFiltered}
        className="ml-auto min-w-[120px] text-right"
      />
    </div>
  );
}
