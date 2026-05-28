import { ResetButton } from "@/components/ui/buttons/reset-button";
import { ShuffleButton } from "@/components/ui/buttons/shuffle-button";
import { RatingFilterDialog } from "@/components/ui/dialogs/rating-filter-dialog";
import { TagFilterDialog } from "@/components/ui/dialogs/tag-filter-dialog";
import { SortDropdownMenu } from "@/components/ui/dropdown-menus/sort-dropdown-menu";
import { FavoritesFiltering } from "@/components/ui/pages/favorites/hooks/use-favorites-filtering";
import { FavoritesSort } from "@/components/ui/pages/favorites/hooks/use-favorites-sort";
import { MediaTypeFilterMultiSelect } from "@/components/ui/selects/media-type-filter-multi-select";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";

interface FavoritesToolbarProps {
  sort: FavoritesSort;
  filtering: FavoritesFiltering;
}

export function FavoritesToolbar({ sort, filtering }: FavoritesToolbarProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2 flex-grow">
        {/* 並び替え */}
        <SortDropdownMenu
          value={sort.value}
          onChange={sort.apply}
          options={sort.options}
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

        {/* シャッフルボタン */}
        <ShuffleButton />

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
