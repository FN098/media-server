import { ResetButton } from "@/components/ui/buttons/reset-button";
import { RatingFilterDialog } from "@/components/ui/dialogs/rating-filter-dialog";
import { TagFilterDialog } from "@/components/ui/dialogs/tag-filter-dialog";
import { ExplorerDialogs } from "@/components/ui/pages/explorer/hooks/use-explorer-dialogs";
import { ExplorerFavorites } from "@/components/ui/pages/explorer/hooks/use-explorer-favorites";
import { ExplorerFiltering } from "@/components/ui/pages/explorer/hooks/use-explorer-filtering";
import { ExplorerSelection } from "@/components/ui/pages/explorer/hooks/use-explorer-selection";
import { ExplorerSort } from "@/components/ui/pages/explorer/hooks/use-explorer-sort";
import { FavoriteFilterSelect } from "@/components/ui/selects/favorite-filter-select";
import { MediaTypeFilterMultiSelect } from "@/components/ui/selects/media-type-filter-multi-select";
import { SortSelect } from "@/components/ui/selects/sort-select";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { Button } from "@/shadcn/components/ui/button";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { FolderPlus, TrashIcon } from "lucide-react";

interface ExplorerToolbarProps {
  sort: ExplorerSort;
  filtering: ExplorerFiltering;
  dialogs: ExplorerDialogs;
  selection: ExplorerSelection;
  favorites: ExplorerFavorites;
}

export function ExplorerToolbar({
  sort,
  filtering,
  dialogs,
  selection,
  favorites,
}: ExplorerToolbarProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2 flex-grow">
        {/* 並び替え */}
        <SortSelect
          value={sort.value}
          onChange={sort.apply}
          options={sort.options}
        />

        {/* お気に入りフィルター */}
        <FavoriteFilterSelect
          value={filtering.controls.favorite.value}
          onChange={filtering.controls.favorite.apply}
        />

        {/* 種別フィルター */}
        <MediaTypeFilterMultiSelect
          value={filtering.controls.mediaType.value}
          onChange={filtering.controls.mediaType.apply}
          displayTypes={["image", "video", "audio"]}
        />

        {/* 評価フィルター */}
        <RatingFilterDialog
          value={filtering.controls.rating.value}
          onChange={filtering.controls.rating.apply}
        />

        {/* タグフィルター */}
        <TagFilterDialog
          value={filtering.controls.tag.value}
          onChange={filtering.controls.tag.apply}
          relatedNodes={filtering.mediaOnly}
          autoFocusInput={!isMobile}
        />

        {/* 新規フォルダ */}
        <Button variant="outline" onClick={dialogs.createFolderDialog.open}>
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
            selection.selectTargets(targets);
            dialogs.deleteDialog.openTargets(targets);
          }}
        >
          <TrashIcon className="h-4 w-4" />
          お気に入り以外一括削除
        </Button>

        {/* リセット */}
        <ResetButton onClick={filtering.reset} isVisible={filtering.canReset} />
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
